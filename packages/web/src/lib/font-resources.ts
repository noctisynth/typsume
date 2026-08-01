import { unzipSync } from 'fflate';
import type { FontResource } from './template-registry';

const ZIP_SIGNATURES = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
  [0x50, 0x4b, 0x07, 0x08],
] as const;

export type FontStatusKind = 'info' | 'warning';

export interface FontStatus {
  kind: FontStatusKind;
  message: string;
}

interface LoadFontOptions {
  fetcher?: typeof fetch;
  report?: (status: FontStatus) => void;
}

interface LocalFontData {
  family: string;
  blob: () => Promise<Blob>;
}

type QueryLocalFonts = () => Promise<LocalFontData[]>;

interface LoadLocalFontOptions {
  queryLocalFonts?: QueryLocalFonts;
  report?: (status: FontStatus) => void;
  inspectFamilies?: (bytes: Uint8Array) => Promise<string[]>;
}

export interface LocalFontFallback {
  family: string;
  fonts: Uint8Array[];
}

export const LOCAL_FONT_FAMILY_CANDIDATES = [
  'Maple Mono NF CN',
  'Maple Mono CN',
  'PingFang SC',
  'Microsoft YaHei',
  'Noto Sans CJK SC',
  'Source Han Sans SC',
] as const;

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
    startsWith(bytes, [0x74, 0x79, 0x70, 0x31]) ||
    startsWith(bytes, [0x74, 0x74, 0x63, 0x66])
  );
}

function isFontPath(path: string): boolean {
  const normalized = path.toLowerCase();
  return normalized.endsWith('.ttf') || normalized.endsWith('.otf');
}

export function displayUrl(value: string): string {
  try {
    const url = new URL(value);
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return '<invalid URL>';
  }
}

export function extractFonts(bytes: Uint8Array): {
  fonts: Uint8Array[];
  invalidFonts: number;
} {
  if (!isZip(bytes)) return { fonts: isFont(bytes) ? [bytes] : [], invalidFonts: 0 };

  const fonts: Uint8Array[] = [];
  let invalidFonts = 0;
  for (const [path, content] of Object.entries(unzipSync(bytes))) {
    if (!isFontPath(path)) continue;
    if (isFont(content)) fonts.push(content);
    else invalidFonts += 1;
  }
  return { fonts, invalidFonts };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function verifyIntegrity(bytes: Uint8Array, integrity: string): Promise<boolean> {
  const expected = /^sha256-([A-Za-z0-9+/]+={0,2})$/.exec(integrity)?.[1];
  if (!expected) return false;
  const input = Uint8Array.from(bytes).buffer;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', input));
  return bytesToBase64(digest) === expected;
}

const pageCache = new Map<string, Promise<Uint8Array[]>>();

async function loadResource(
  resource: FontResource,
  resourceIndex: number,
  options: LoadFontOptions,
): Promise<Uint8Array[]> {
  const fetcher = options.fetcher ?? fetch;
  const report = options.report ?? (() => undefined);

  for (const [urlIndex, url] of resource.urls.entries()) {
    const shownUrl = displayUrl(url);
    const hasNext = urlIndex + 1 < resource.urls.length;
    const nextStep = hasNext ? 'Trying the next mirror.' : 'No mirrors remain.';
    try {
      report({ kind: 'info', message: `Downloading font resource ${resourceIndex + 1}.` });
      const response = await fetcher(url);
      if (!response.ok) {
        report({
          kind: 'warning',
          message: `Font download failed (${response.status}) from ${shownUrl}. ${nextStep}`,
        });
        continue;
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      if (resource.integrity && !(await verifyIntegrity(bytes, resource.integrity))) {
        report({
          kind: 'warning',
          message: `Font integrity check failed for ${shownUrl}. ${nextStep}`,
        });
        continue;
      }

      let extracted: ReturnType<typeof extractFonts>;
      try {
        extracted = extractFonts(bytes);
      } catch {
        report({
          kind: 'warning',
          message: `Font ZIP extraction failed for ${shownUrl}. ${nextStep}`,
        });
        continue;
      }

      if (extracted.invalidFonts > 0) {
        report({
          kind: 'warning',
          message: `${extracted.invalidFonts} invalid font file(s) were skipped from ${shownUrl}.`,
        });
      }
      if (extracted.fonts.length === 0) {
        report({
          kind: 'warning',
          message: `No supported TTF or OTF fonts were found at ${shownUrl}. ${nextStep}`,
        });
        continue;
      }
      return extracted.fonts;
    } catch {
      report({ kind: 'warning', message: `Font download failed from ${shownUrl}. ${nextStep}` });
    }
  }

  options.report?.({
    kind: 'warning',
    message: `Font resource ${resourceIndex + 1} could not be loaded. Compilation will continue without it; layout may change or compilation may fail.`,
  });
  return [];
}

export async function loadBrowserFonts(
  resources: FontResource[],
  options: LoadFontOptions = {},
): Promise<Uint8Array[]> {
  const loaded: Uint8Array[] = [];
  for (const [index, resource] of resources.entries()) {
    const key = JSON.stringify(resource);
    let pending = pageCache.get(key);
    if (!pending) {
      pending = loadResource(resource, index, options).then((fonts) => {
        if (fonts.length === 0) pageCache.delete(key);
        return fonts;
      });
      pageCache.set(key, pending);
    } else {
      options.report?.({
        kind: 'info',
        message: `Reusing font resource ${index + 1} from memory.`,
      });
    }
    loaded.push(...(await pending));
  }
  return loaded;
}

function browserLocalFontQuery(): QueryLocalFonts | undefined {
  if (typeof window === 'undefined') return undefined;
  const candidate = (window as typeof window & { queryLocalFonts?: () => Promise<LocalFontData[]> })
    .queryLocalFonts;
  return candidate?.bind(window);
}

function normalizeFamily(family: string): string {
  return family.trim().toLocaleLowerCase();
}

export async function loadLocalFontFallback(
  preferredFamilies: string[],
  options: LoadLocalFontOptions = {},
): Promise<LocalFontFallback | null> {
  const report = options.report ?? (() => undefined);
  const queryLocalFonts = options.queryLocalFonts ?? browserLocalFontQuery();
  if (!queryLocalFonts) {
    report({
      kind: 'warning',
      message:
        'Local Font Access is unavailable in this browser. Compilation will continue without a local fallback font.',
    });
    return null;
  }

  let available: LocalFontData[];
  try {
    report({ kind: 'info', message: 'Requesting access to compatible local fonts.' });
    available = await queryLocalFonts();
  } catch {
    report({
      kind: 'warning',
      message:
        'Local font access was denied or failed. Compilation will continue without a local fallback font.',
    });
    return null;
  }

  const candidates = [...preferredFamilies, ...LOCAL_FONT_FAMILY_CANDIDATES].filter(
    (family, index, families) =>
      families.findIndex((candidate) => normalizeFamily(candidate) === normalizeFamily(family)) ===
      index,
  );
  const selectedFamily = candidates.find((candidate) =>
    available.some((font) => normalizeFamily(font.family) === normalizeFamily(candidate)),
  );
  if (!selectedFamily) {
    report({
      kind: 'warning',
      message:
        'No compatible local fallback font was found. Compilation will continue without a local fallback font.',
    });
    return null;
  }

  const fonts: Uint8Array[] = [];
  const internalFamilies: string[] = [];
  for (const font of available) {
    if (normalizeFamily(font.family) !== normalizeFamily(selectedFamily)) continue;
    try {
      const bytes = new Uint8Array(await (await font.blob()).arrayBuffer());
      if (options.inspectFamilies) {
        internalFamilies.push(...(await options.inspectFamilies(bytes)));
      }
      fonts.push(bytes);
    } catch {
      report({
        kind: 'warning',
        message: `A local font face from ${selectedFamily} could not be read and was skipped.`,
      });
    }
  }

  if (fonts.length === 0) {
    report({
      kind: 'warning',
      message: `Local font ${selectedFamily} was found but none of its font faces could be read. Compilation will continue without it.`,
    });
    return null;
  }

  const internalFamily = internalFamilies[0] ?? selectedFamily;
  report({
    kind: 'warning',
    message: `Using local font ${internalFamily} because the template font could not be downloaded; layout may differ.`,
  });
  return { family: internalFamily, fonts };
}

export function clearFontPageCache(): void {
  pageCache.clear();
}
