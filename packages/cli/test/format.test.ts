import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { ExitCode, type TypsumeError } from '../src/errors.ts';
import { parseSource } from '../src/format.ts';

const directories: string[] = [];
const temporaryDirectory = () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'typsume-format-test-'));
  directories.push(directory);
  return directory;
};
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe('source parsing', () => {
  test.each([
    ['resume.json', '{"value": 1}'],
    ['resume.yaml', 'value: 1\n'],
    ['resume.toml', 'value = 1\n'],
  ])('parses %s', (name, content) => {
    const path = resolve(temporaryDirectory(), name);
    writeFileSync(path, content);
    expect(parseSource(path).data).toEqual({ value: 1 });
  });

  test('distinguishes read and parse failures', () => {
    try {
      parseSource(resolve(temporaryDirectory(), 'missing.json'));
    } catch (error) {
      expect((error as TypsumeError).exitCode).toBe(ExitCode.inputRead);
    }
    const invalid = resolve(temporaryDirectory(), 'invalid.json');
    writeFileSync(invalid, '{');
    try {
      parseSource(invalid);
    } catch (error) {
      expect((error as TypsumeError).exitCode).toBe(ExitCode.parse);
    }
  });
});
