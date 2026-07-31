import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { zipSync } from 'fflate';
import { displayUrl, loadRemoteFonts } from '../src/font-resources.ts';

const temporaryDirectories: string[] = [];

function temporaryDirectory(): string {
  const directory = mkdtempSync(resolve(tmpdir(), 'typsume-font-test-'));
  temporaryDirectories.push(directory);
  return directory;
}

function fakeTtf(marker = 0): Uint8Array {
  return new Uint8Array([0x00, 0x01, 0x00, 0x00, marker]);
}

function fakeOtf(marker = 0): Uint8Array {
  return new Uint8Array([0x4f, 0x54, 0x54, 0x4f, marker]);
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('remote font resources', () => {
  test('loads a direct font and reuses the raw project cache', async () => {
    const cacheDir = temporaryDirectory();
    let fetchCount = 0;
    const fetcher = async () => {
      fetchCount += 1;
      return new Response(fakeTtf(1));
    };
    const resources = [{ urls: ['https://fonts.example.com/main.ttf'] }];

    const first = await loadRemoteFonts(resources, { cacheDir, fetcher });
    const second = await loadRemoteFonts(resources, { cacheDir, fetcher });

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(fetchCount).toBe(1);
    expect(readdirSync(cacheDir)).toHaveLength(1);
  });

  test('extracts every valid TTF and OTF from a ZIP', async () => {
    const cacheDir = temporaryDirectory();
    const archive = zipSync({
      'fonts/Regular.ttf': fakeTtf(1),
      'fonts/Bold.otf': fakeOtf(2),
      'OFL.txt': new TextEncoder().encode('license'),
    });

    const fonts = await loadRemoteFonts([{ urls: ['https://fonts.example.com/all.zip'] }], {
      cacheDir,
      fetcher: async () => new Response(archive),
    });

    expect(fonts).toHaveLength(2);
  });

  test('tries the next mirror and removes query parameters from warnings', async () => {
    const cacheDir = temporaryDirectory();
    const warnings: string[] = [];
    const requested: string[] = [];
    const urls = [
      'https://fonts.example.com/missing.zip?token=secret-value',
      'https://mirror.example.com/font.ttf',
    ];

    const fonts = await loadRemoteFonts([{ urls }], {
      cacheDir,
      warn: (message) => warnings.push(message),
      fetcher: async (input) => {
        requested.push(String(input));
        return requested.length === 1
          ? new Response(null, { status: 503 })
          : new Response(fakeTtf());
      },
    });

    expect(fonts).toHaveLength(1);
    expect(requested).toEqual(urls);
    expect(warnings.join('\n')).toContain('The next mirror will be tried.');
    expect(warnings.join('\n')).not.toContain('secret-value');
  });

  test('rejects an integrity mismatch and explains compilation fallback', async () => {
    const warnings: string[] = [];
    const fonts = await loadRemoteFonts(
      [
        {
          urls: ['https://fonts.example.com/font.ttf'],
          integrity: 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        },
      ],
      {
        cacheDir: temporaryDirectory(),
        warn: (message) => warnings.push(message),
        fetcher: async () => new Response(fakeTtf()),
      },
    );

    expect(fonts).toHaveLength(0);
    expect(warnings.join('\n')).toContain('integrity check failed');
    expect(warnings.join('\n')).toContain('Compilation will continue without it');
  });

  test('redownloads a corrupted cache with an explicit warning', async () => {
    const cacheDir = temporaryDirectory();
    const resources = [{ urls: ['https://fonts.example.com/font.ttf'] }];
    let fetchCount = 0;
    const fetcher = async () => {
      fetchCount += 1;
      return new Response(fakeTtf(fetchCount));
    };

    await loadRemoteFonts(resources, { cacheDir, fetcher });
    const [cacheName] = readdirSync(cacheDir);
    if (!cacheName) throw new Error('cache file was not created');
    writeFileSync(resolve(cacheDir, cacheName), 'truncated');

    const warnings: string[] = [];
    const fonts = await loadRemoteFonts(resources, {
      cacheDir,
      fetcher,
      warn: (message) => warnings.push(message),
    });

    expect(fonts).toHaveLength(1);
    expect(fetchCount).toBe(2);
    expect(warnings.join('\n')).toContain('will be removed and downloaded again');
    expect(readFileSync(resolve(cacheDir, cacheName))).toEqual(fakeTtf(2));
  });

  test('sanitizes invalid and credential-bearing URLs', () => {
    expect(displayUrl('not a URL')).toBe('<invalid URL>');
    expect(displayUrl('https://fonts.example.com/a.zip?token=secret#fragment')).toBe(
      'https://fonts.example.com/a.zip',
    );
  });
});
