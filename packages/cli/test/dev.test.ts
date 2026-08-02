import { afterEach, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createDebouncedRebuild, startDevWatch, type WatchReport } from '../src/commands/dev.ts';

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('dev rebuild trigger debounces changes and reports a build failure', async () => {
  let builds = 0;
  await new Promise<void>((done, reject) => {
    const timeout = setTimeout(() => reject(new Error('debounced rebuild did not run')), 2000);
    const trigger = createDebouncedRebuild(
      async () => {
        builds += 1;
        throw new Error('expected failure');
      },
      ({ error }) => {
        clearTimeout(timeout);
        expect(error?.message).toBe('expected failure');
        done();
      },
      20,
    );
    trigger();
    trigger();
  });
  expect(builds).toBe(1);
});

test('dev builds once before watching source and project configuration', async () => {
  const root = mkdtempSync(resolve(tmpdir(), 'typsume-dev-test-'));
  directories.push(root);
  const sourcePath = resolve(root, 'resume.toml');
  const configPath = resolve(root, 'typsume.config.toml');
  writeFileSync(sourcePath, 'schema = "typst-resume/1.0"\n');

  let builds = 0;
  let nextReport: ((result: WatchReport) => void) | undefined;
  const watchers = await startDevWatch(
    [sourcePath, configPath],
    async () => {
      builds += 1;
    },
    (result) => nextReport?.(result),
    (error) => {
      throw error;
    },
    20,
  );

  expect(builds).toBe(1);
  expect(watchers).toHaveLength(2);

  async function update(path: string, content: string) {
    await new Promise<void>((done, reject) => {
      const timeout = setTimeout(() => reject(new Error(`watch did not rebuild ${path}`)), 2000);
      nextReport = ({ error }) => {
        clearTimeout(timeout);
        nextReport = undefined;
        if (error) reject(error);
        else done();
      };
      writeFileSync(path, content);
    });
  }

  try {
    await update(sourcePath, 'schema = "typst-resume/1.0"\n# source update\n');
    await update(configPath, 'template = "default"\n');
    expect(builds).toBe(3);
  } finally {
    for (const watcher of watchers) watcher.close();
  }
});
