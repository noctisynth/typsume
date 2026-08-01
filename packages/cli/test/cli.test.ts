import { afterEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ExitCode } from '../src/errors.ts';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mainPath = resolve(packageRoot, 'src/main.ts');
const bunExecutable = Bun.which('bun') ?? process.execPath;
const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

async function runCli(
  args: string[],
  cwd = packageRoot,
  environment: Record<string, string | undefined> = {},
) {
  const home = mkdtempSync(resolve(tmpdir(), 'typsume-cli-home-'));
  directories.push(home);
  const subprocess = Bun.spawn([bunExecutable, mainPath, ...args], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...Bun.env, HOME: home, XDG_CONFIG_HOME: resolve(home, '.config'), ...environment },
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    subprocess.exited,
    new Response(subprocess.stdout).text(),
    new Response(subprocess.stderr).text(),
  ]);
  return { exitCode, stdout, stderr };
}

describe('CLI smoke', () => {
  test('help exits successfully for the root and every W3 command', async () => {
    expect((await runCli(['--help'])).exitCode).toBe(ExitCode.success);
    for (const command of ['build', 'validate', 'dump', 'templates', 'init', 'dev']) {
      expect((await runCli([command, '--help'])).exitCode).toBe(ExitCode.success);
    }
    expect(existsSync(resolve(packageRoot, 'Library'))).toBe(false);
    expect(existsSync(resolve(packageRoot, '.xdg'))).toBe(false);
  });

  test('validate and dump accept the shared sample', async () => {
    const fixture = resolve(packageRoot, '../core/test/fixtures/sample.json');
    expect((await runCli(['validate', fixture])).exitCode).toBe(ExitCode.success);
    const dumped = await runCli(['dump', fixture]);
    expect(dumped.exitCode).toBe(ExitCode.success);
    expect(JSON.parse(dumped.stdout).schema).toBe('typst-resume/1.0');
  });

  test('read, parse, and schema failures use distinct exit codes', async () => {
    const root = mkdtempSync(resolve(tmpdir(), 'typsume-cli-test-'));
    directories.push(root);
    expect((await runCli(['validate', 'missing.json'], root)).exitCode).toBe(ExitCode.inputRead);
    writeFileSync(resolve(root, 'broken.json'), '{');
    expect((await runCli(['validate', 'broken.json'], root)).exitCode).toBe(ExitCode.parse);
    writeFileSync(
      resolve(root, 'invalid.json'),
      JSON.stringify({ schema: 'typst-resume/1.0', basics: { name: '' } }),
    );
    const invalid = await runCli(['validate', 'invalid.json'], root);
    expect(invalid.exitCode).toBe(ExitCode.schema);
    expect(invalid.stderr).toContain('basics.name');
  });

  test('templates supports JSON output', async () => {
    const result = await runCli(['templates', '--json']);
    expect(result.exitCode).toBe(ExitCode.success);
    expect(
      JSON.parse(result.stdout).some((template: { name: string }) => template.name === 'default'),
    ).toBe(true);
  });

  test('init supports explicit GitHub Actions workflow choices', async () => {
    const enabledRoot = mkdtempSync(resolve(tmpdir(), 'typsume-cli-test-'));
    const disabledRoot = mkdtempSync(resolve(tmpdir(), 'typsume-cli-test-'));
    directories.push(enabledRoot, disabledRoot);

    expect((await runCli(['init', '.', '--github-actions'], enabledRoot)).exitCode).toBe(
      ExitCode.success,
    );
    expect(existsSync(resolve(enabledRoot, '.github', 'workflows', 'resume.yml'))).toBe(true);

    expect((await runCli(['init', '.', '--no-github-actions'], disabledRoot)).exitCode).toBe(
      ExitCode.success,
    );
    expect(existsSync(resolve(disabledRoot, '.github', 'workflows', 'resume.yml'))).toBe(false);
  });

  test('build applies project strict configuration when the flag is absent', async () => {
    const root = mkdtempSync(resolve(tmpdir(), 'typsume-cli-test-'));
    directories.push(root);
    writeFileSync(
      resolve(root, 'resume.json'),
      JSON.stringify({ schema: 'typst-resume/1.0', basics: { name: 'Xxx Yyy' } }),
    );
    mkdirSync(resolve(root, 'template'));
    writeFileSync(
      resolve(root, 'template', 'meta.toml'),
      'name = "custom"\nrequired-fields = ["basics.title"]\n',
    );
    writeFileSync(
      resolve(root, 'template', 'template.typ'),
      '#set page(width: 1cm, height: 1cm)\n',
    );
    writeFileSync(
      resolve(root, 'typsume.config.toml'),
      'template = "./template"\n[build]\nstrict = true\n',
    );
    expect((await runCli(['build', 'resume.json', '--dry-run'], root)).exitCode).toBe(
      ExitCode.schema,
    );
  });

  test('build reports generated output relative to the working directory', async () => {
    const root = mkdtempSync(resolve(tmpdir(), 'typsume-cli-test-'));
    directories.push(root);
    writeFileSync(
      resolve(root, 'resume.json'),
      JSON.stringify({ schema: 'typst-resume/1.0', basics: { name: 'Xxx Yyy' } }),
    );

    const result = await runCli(['build', 'resume.json', '--dry-run'], root, {
      CI: undefined,
      GITHUB_ACTIONS: undefined,
      NODE_ENV: 'production',
    });
    expect(result.exitCode).toBe(ExitCode.success);
    const output = `${result.stdout}\n${result.stderr}`;
    expect(output).toContain('resume-normalized.json');
    expect(output).not.toContain(resolve(root, 'resume-normalized.json'));
  });
});
