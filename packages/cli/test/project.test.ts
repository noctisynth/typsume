import { afterEach, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { ensureProjectRuntime, findProjectRoot } from '../src/project.ts';

const temporaryDirectories: string[] = [];

function temporaryDirectory(): string {
  const directory = mkdtempSync(resolve(tmpdir(), 'typsume-project-test-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('resume project runtime', () => {
  test('finds the nearest config above the source', () => {
    const projectRoot = temporaryDirectory();
    const sourcePath = resolve(projectRoot, 'content', 'resume.json');
    mkdirSync(dirname(sourcePath), { recursive: true });
    writeFileSync(resolve(projectRoot, 'typsume.config.toml'), 'template = "default"\n');
    writeFileSync(sourcePath, '{}');

    expect(findProjectRoot(sourcePath)).toBe(projectRoot);
  });

  test('falls back to the source directory and creates an ignored runtime', () => {
    const projectRoot = temporaryDirectory();
    const sourcePath = resolve(projectRoot, 'resume.json');
    writeFileSync(sourcePath, '{}');

    expect(findProjectRoot(sourcePath)).toBe(projectRoot);
    const fontsDir = ensureProjectRuntime(projectRoot);

    expect(fontsDir).toBe(resolve(projectRoot, '.typsume', 'fonts'));
    expect(readFileSync(resolve(projectRoot, '.typsume', '.gitignore'), 'utf-8')).toBe('*\n');
  });
});
