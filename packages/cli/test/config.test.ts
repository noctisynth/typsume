import { afterEach, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { expandHomePath, getGlobalConfigPath, loadConfig } from '../src/config.ts';
import { ExitCode, TypsumeError } from '../src/errors.ts';

const temporaryDirectories: string[] = [];
const temporaryDirectory = () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'typsume-config-test-'));
  temporaryDirectories.push(directory);
  return directory;
};

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe('CLI configuration', () => {
  test('loads strict project and XDG global configuration', () => {
    const root = temporaryDirectory();
    const project = resolve(root, 'project');
    const xdg = resolve(root, 'xdg');
    mkdirSync(resolve(xdg, 'typsume'), { recursive: true });
    mkdirSync(project);
    writeFileSync(
      resolve(project, 'typsume.config.toml'),
      'template = "default"\noutput = "build/cv.pdf"\n[build]\nstrict = true\n[config]\ntheme-color = "#112233"\nfont-size = 9\n',
    );
    writeFileSync(resolve(xdg, 'typsume', 'config.toml'), 'templates-dir = "~/templates"\n');

    const config = loadConfig(project, { homeDir: root, xdgConfigHome: xdg });
    expect(config.project?.output).toBe('build/cv.pdf');
    expect(config.project?.build?.strict).toBe(true);
    expect(config.project?.config?.['theme-color']).toBe('#112233');
    expect(config.project?.config?.['font-size']).toBe(9);
    expect(config.global?.['templates-dir']).toBe('~/templates');
    expect(getGlobalConfigPath({ homeDir: root, xdgConfigHome: xdg })).toBe(
      resolve(xdg, 'typsume', 'config.toml'),
    );
    expect(expandHomePath('~/templates', root)).toBe(resolve(root, 'templates'));
  });

  test('rejects unknown configuration keys', () => {
    const project = temporaryDirectory();
    writeFileSync(resolve(project, 'typsume.config.toml'), 'unknown = true\n');
    expect(() => loadConfig(project, { homeDir: project })).toThrow(TypsumeError);
    try {
      loadConfig(project, { homeDir: project });
    } catch (error) {
      expect((error as TypsumeError).exitCode).toBe(ExitCode.schema);
    }
  });

  test('reports malformed TOML as a parse failure', () => {
    const project = temporaryDirectory();
    writeFileSync(resolve(project, 'typsume.config.toml'), 'template = [\n');
    expect(() => loadConfig(project, { homeDir: project })).toThrow(TypsumeError);
    try {
      loadConfig(project, { homeDir: project });
    } catch (error) {
      expect((error as TypsumeError).exitCode).toBe(ExitCode.parse);
    }
  });
});
