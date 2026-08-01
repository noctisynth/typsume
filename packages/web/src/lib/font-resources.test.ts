import { zipSync } from 'fflate';
import { beforeEach, describe, expect, test } from 'vitest';
import {
  clearFontPageCache,
  displayUrl,
  extractFonts,
  loadBrowserFonts,
  loadLocalFontFallback,
} from './font-resources';

const TTF_BYTES = new Uint8Array([0x00, 0x01, 0x00, 0x00, 0x74, 0x65, 0x73, 0x74]);

describe('browser font resources', () => {
  beforeEach(clearFontPageCache);

  test('loads a direct font and reuses it for the page lifetime', async () => {
    let requests = 0;
    const fetcher: typeof fetch = async () => {
      requests += 1;
      return new Response(TTF_BYTES);
    };
    const resources = [{ urls: ['https://example.com/font.ttf'] }];

    expect(await loadBrowserFonts(resources, { fetcher })).toHaveLength(1);
    expect(await loadBrowserFonts(resources, { fetcher })).toHaveLength(1);
    expect(requests).toBe(1);
  });

  test('extracts valid TTF and OTF files from ZIP responses', () => {
    const archive = zipSync({
      'fonts/regular.ttf': TTF_BYTES,
      'fonts/bold.otf': new Uint8Array([0x4f, 0x54, 0x54, 0x4f, 0x74, 0x65, 0x73, 0x74]),
      'fonts/broken.ttf': new Uint8Array([1, 2, 3]),
      'README.md': new TextEncoder().encode('ignored'),
    });
    const extracted = extractFonts(archive);
    expect(extracted.invalidFonts).toBe(1);
    expect(extracted.fonts).toHaveLength(2);
    expect(extracted.fonts[0]).toEqual(TTF_BYTES);
  });

  test('reports mirror failures without exposing credentials or query parameters', async () => {
    const warnings: string[] = [];
    await loadBrowserFonts(
      [
        {
          urls: [
            'https://user:secret@example.com/font.ttf?token=private',
            'https://example.org/font.ttf',
          ],
        },
      ],
      {
        fetcher: async () => new Response(null, { status: 503 }),
        report: (status) => {
          if (status.kind === 'warning') warnings.push(status.message);
        },
      },
    );
    expect(warnings.join('\n')).not.toContain('secret');
    expect(warnings.join('\n')).not.toContain('token=private');
    expect(warnings.join('\n')).toContain('Trying the next mirror');
    expect(displayUrl('not a url')).toBe('<invalid URL>');
  });

  test('prefers the requested local family and loads all of its font faces', async () => {
    const localBlob = () => Promise.resolve(new Blob([TTF_BYTES.slice().buffer]));
    const fallback = await loadLocalFontFallback(['Maple Mono NF'], {
      queryLocalFonts: async () => [
        { family: 'PingFang SC', blob: localBlob },
        { family: 'Maple Mono NF', blob: localBlob },
        { family: 'Maple Mono NF', blob: localBlob },
      ],
      inspectFamilies: async () => ['Maple Mono NF CN'],
    });

    expect(fallback?.family).toBe('Maple Mono NF CN');
    expect(fallback?.fonts).toHaveLength(2);
  });

  test('reports denied local font access without hiding the fallback behavior', async () => {
    const warnings: string[] = [];
    const fallback = await loadLocalFontFallback(['Maple Mono NF'], {
      queryLocalFonts: async () => {
        throw new DOMException('Denied', 'NotAllowedError');
      },
      report: (status) => {
        if (status.kind === 'warning') warnings.push(status.message);
      },
    });

    expect(fallback).toBeNull();
    expect(warnings.join('\n')).toContain('denied or failed');
    expect(warnings.join('\n')).toContain('continue without a local fallback font');
  });
});
