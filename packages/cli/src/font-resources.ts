import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { unzipSync } from 'fflate';
import { logger } from './logger.ts';
import type { FontResource } from './meta.ts';

const ZIP_SIGNATURES = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
  [0x50, 0x4b, 0x07, 0x08],
] as const;

export interface FontResourceOptions {
  cacheDir: string;
  fetcher?: typeof fetch;
  warn?: (message: string) => void;
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function isZip(bytes: Uint8Array): boolean {
  return ZIP_SIGNATURES.some((signature) => startsWith(bytes, signature));
}

function isFont(bytes: Uint8Array): boolean {
  return (
    startsWith(bytes, [0x00, 0x01, 0x00, 0x00]) ||
    startsWith(bytes, [0x4f, 0x54, 0x54, 0x4f]) ||
    startsWith(bytes, [0x74, 0x72, 0x75, 0x65]) ||
    startsWith(bytes, [0x74, 0x79, 0x70, 0x31])
  );
}

function isFontPath(path: string): boolean {
  const normalized = path.toLowerCase();
  return normalized.endsWith('.ttf') || normalized.endsWith('.otf');
}

export function displayUrl(value: string): string {
  try {
    const url = new URL(value);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return '<invalid URL>';
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function verifyIntegrity(bytes: Uint8Array, integrity: string): Promise<boolean> {
  const match = /^sha256-([A-Za-z0-9+/]+={0,2})$/.exec(integrity);
  if (!match?.[1]) return false;
  const digestInput = Uint8Array.from(bytes).buffer;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', digestInput));
  return bytesToBase64(digest) === match[1];
}

async function resourceKey(resource: FontResource): Promise<string> {
  const declaration = JSON.stringify({
    urls: resource.urls,
    integrity: resource.integrity ?? null,
  });
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(declaration)),
  );
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function writeCacheAtomically(cachePath: string, bytes: Uint8Array): void {
  const temporaryPath = `${cachePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryPath, bytes);
    renameSync(temporaryPath, cachePath);
  } finally {
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
  }
}

function extractFonts(bytes: Uint8Array): { fonts: Uint8Array[]; invalidFonts: number } {
  if (!isZip(bytes)) {
    return { fonts: isFont(bytes) ? [bytes] : [], invalidFonts: 0 };
  }

  const files = unzipSync(bytes);
  const fonts: Uint8Array[] = [];
  let invalidFonts = 0;
  for (const [path, content] of Object.entries(files)) {
    if (!isFontPath(path)) continue;
    if (isFont(content)) fonts.push(content);
    else invalidFonts += 1;
  }
  return { fonts, invalidFonts };
}

export async function loadRemoteFonts(
  resources: FontResource[],
  options: FontResourceOptions,
): Promise<Uint8Array[]> {
  const fetcher = options.fetcher ?? fetch;
  const warn = options.warn ?? ((message: string) => logger.warn(message));
  const loaded: Uint8Array[] = [];

  for (const [resourceIndex, resource] of resources.entries()) {
    if (resource.urls.length === 0) {
      warn(
        `Font resource ${resourceIndex + 1} has no URLs; it will not be loaded and compilation will continue.`,
      );
      continue;
    }

    const cachePath = resolve(options.cacheDir, await resourceKey(resource));
    if (existsSync(cachePath)) {
      let cachedFonts: ReturnType<typeof extractFonts> | null = null;
      try {
        const cachedBytes = readFileSync(cachePath);
        const integrityValid =
          !resource.integrity || (await verifyIntegrity(cachedBytes, resource.integrity));
        if (integrityValid) {
          cachedFonts = extractFonts(cachedBytes);
        }
      } catch {
        cachedFonts = null;
      }

      if (cachedFonts && cachedFonts.fonts.length > 0) {
        if (cachedFonts.invalidFonts > 0) {
          warn(
            `${cachedFonts.invalidFonts} invalid cached font file(s) were skipped; valid cached fonts will still be loaded.`,
          );
        }
        loaded.push(...cachedFonts.fonts);
        continue;
      }

      warn(
        `Cached font resource ${resourceIndex + 1} is invalid. It will be removed and downloaded again.`,
      );
      try {
        unlinkSync(cachePath);
      } catch {
        warn(
          `The invalid font cache could not be removed. Downloading will continue, but the refreshed resource may not be cached.`,
        );
      }
    }

    let resourceLoaded = false;
    for (const [urlIndex, url] of resource.urls.entries()) {
      const shownUrl = displayUrl(url);
      const hasNext = urlIndex + 1 < resource.urls.length;
      const nextStep = hasNext
        ? 'The next mirror will be tried.'
        : 'No mirrors remain for this font resource.';

      try {
        const response = await fetcher(url);
        if (!response.ok) {
          warn(`Font download failed (${response.status}) from ${shownUrl}. ${nextStep}`);
          continue;
        }

        const bytes = new Uint8Array(await response.arrayBuffer());
        if (resource.integrity && !(await verifyIntegrity(bytes, resource.integrity))) {
          warn(`Font integrity check failed for ${shownUrl}. ${nextStep}`);
          continue;
        }

        let extracted: ReturnType<typeof extractFonts>;
        try {
          extracted = extractFonts(bytes);
        } catch {
          warn(`Font ZIP extraction failed for ${shownUrl}. ${nextStep}`);
          continue;
        }

        if (extracted.invalidFonts > 0) {
          warn(
            `${extracted.invalidFonts} invalid font file(s) were skipped from ${shownUrl}; valid fonts will still be loaded.`,
          );
        }
        if (extracted.fonts.length === 0) {
          warn(`No supported TTF or OTF fonts were found at ${shownUrl}. ${nextStep}`);
          continue;
        }

        try {
          writeCacheAtomically(cachePath, bytes);
        } catch {
          warn(
            `The downloaded font could not be saved to the project cache. It will still be used for this compilation and downloaded again next time.`,
          );
        }
        loaded.push(...extracted.fonts);
        resourceLoaded = true;
        break;
      } catch {
        warn(`Font download failed from ${shownUrl}. ${nextStep}`);
      }
    }

    if (!resourceLoaded) {
      warn(
        `Font resource ${resourceIndex + 1} could not be loaded. Compilation will continue without it; layout may change or compilation may fail if no usable font is available.`,
      );
    }
  }

  return loaded;
}
