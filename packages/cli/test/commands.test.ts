import { afterEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { buildResume } from '../src/commands/build.ts';
import { initProject } from '../src/commands/init.ts';
import { listTemplates } from '../src/commands/templates.ts';
import type { CompileOptions } from '../src/compiler.ts';
import { ExitCode, type TypsumeError } from '../src/errors.ts';
import { parseSource, type SourceFormat } from '../src/format.ts';

const directories: string[] = [];
const temporaryDirectory = () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'typsume-command-test-'));
  directories.push(directory);
  return directory;
};
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

const minimalResume = { schema: 'typst-resume/1.0', basics: { name: 'Xxx Yyy' } };
const fakeCompile = async (options: CompileOptions) => {
  await options.reportProgress?.('Compiling the PDF with Typst');
  return { pdf: new Uint8Array([0x25, 0x50, 0x44, 0x46]), bytes: 4 };
};

function writeTemplate(directory: string, name: string, required = 'basics.name') {
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    resolve(directory, 'meta.toml'),
    `name = "${name}"\ndisplay-name = "${name}"\nrequired-fields = ["${required}"]\n`,
  );
  writeFileSync(resolve(directory, 'template.typ'), '#set page(width: 1cm, height: 1cm)\n');
}

describe('CLI command workflows', () => {
  test('init output can pass through build with project output configuration', async () => {
    const root = temporaryDirectory();
    const progress: string[] = [];
    initProject('.', root);
    const result = await buildResume(
      { source: 'resume.toml' },
      {
        cwd: root,
        homeDir: root,
        configEnvironment: { homeDir: root },
        compile: fakeCompile,
        reportProgress: (message) => progress.push(message),
      },
    );
    expect(result.outputPath).toBe(resolve(root, 'resume.pdf'));
    expect(readFileSync(result.outputPath)).toEqual(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
    expect(readFileSync(resolve(root, '.typsume', '.gitignore'), 'utf-8')).toBe('*\n');
    expect(progress).toEqual([
      'Reading configuration and validating resume data',
      'Resolving the resume template',
      'Compiling the PDF with Typst',
      'Writing the generated PDF',
    ]);
  });

  test('init defaults to TOML and supports every declared source format', () => {
    const root = temporaryDirectory();
    const cases: Array<[SourceFormat, string]> = [
      ['toml', 'resume.toml'],
      ['json', 'resume.json'],
      ['yaml', 'resume.yaml'],
    ];

    for (const [format, filename] of cases) {
      const directory = resolve(root, format);
      const result = initProject('.', directory, format);
      expect(result.resumePath).toBe(resolve(directory, filename));
      expect(parseSource(result.resumePath).data).toMatchObject({
        schema: 'typst-resume/1.0',
        basics: { name: '你的名字' },
      });
    }
  });

  test('init can generate a main-branch GitHub Actions PDF artifact workflow', () => {
    const root = temporaryDirectory();
    const result = initProject('.', root, 'yaml', true);
    expect(result.workflowPath).toBe(resolve(root, '.github', 'workflows', 'resume.yml'));
    const workflow = readFileSync(result.workflowPath as string, 'utf-8');
    expect(workflow).toContain('branches: [main]');
    expect(workflow).toContain(
      'bunx @typsume/cli@latest build resume.yaml --output resume.pdf --allow-downloads',
    );
    expect(workflow).toContain('actions/checkout@v6');
    expect(workflow).toContain('oven-sh/setup-bun@v2');
    expect(workflow).toContain('actions/cache@v5');
    expect(workflow).toContain('path: .typsume/fonts');
    expect(workflow).toContain(
      `key: \${{ runner.os }}-typsume-fonts-\${{ hashFiles('typsume.config.toml') }}`,
    );
    expect(workflow).not.toContain("hashFiles('typsume.config.toml', 'resume.yaml')");
    expect(workflow).toContain('actions/upload-artifact@v7');
    expect(workflow).toContain('path: resume.pdf');
    expect(workflow).toContain('archive: false');
    expect(workflow).not.toContain('name: resume\n');
  });

  test('CLI output overrides project output and dry-run writes normalized JSON', async () => {
    const root = temporaryDirectory();
    writeFileSync(resolve(root, 'resume.json'), JSON.stringify(minimalResume));
    writeFileSync(resolve(root, 'typsume.config.toml'), 'output = "configured.pdf"\n');
    const built = await buildResume(
      { source: 'resume.json', output: 'flag.pdf' },
      { cwd: root, configEnvironment: { homeDir: root }, compile: fakeCompile },
    );
    expect(built.outputPath).toBe(resolve(root, 'flag.pdf'));
    expect(existsSync(resolve(root, 'configured.pdf'))).toBe(false);

    const dryRun = await buildResume(
      { source: 'resume.json', dryRun: true },
      { cwd: root, configEnvironment: { homeDir: root } },
    );
    expect(dryRun.outputPath).toBe(resolve(root, 'resume-normalized.json'));
    expect(JSON.parse(readFileSync(dryRun.outputPath, 'utf-8')).awards).toEqual([]);
  });

  test('project template configuration overrides metadata defaults', async () => {
    const root = temporaryDirectory();
    writeFileSync(resolve(root, 'resume.json'), JSON.stringify(minimalResume));
    writeFileSync(
      resolve(root, 'typsume.config.toml'),
      '[config]\ntheme-color = "#112233"\nheading-size = 16\n',
    );
    let compileOptions: CompileOptions | undefined;
    await buildResume(
      { source: 'resume.json' },
      {
        cwd: root,
        configEnvironment: { homeDir: root },
        compile: async (options) => {
          compileOptions = options;
          return fakeCompile(options);
        },
      },
    );
    expect(compileOptions?.config.colors.theme).toBe('#112233');
    expect(compileOptions?.config.sizes.heading).toBe(16);
  });

  test('mounts only the project-relative photo referenced by resume data', async () => {
    const root = temporaryDirectory();
    mkdirSync(resolve(root, 'assets'));
    writeFileSync(resolve(root, 'assets', 'profile.png'), new Uint8Array([137, 80, 78, 71]));
    writeFileSync(
      resolve(root, 'resume.json'),
      JSON.stringify({
        ...minimalResume,
        basics: { ...minimalResume.basics, photo: 'assets/profile.png' },
      }),
    );
    let compileOptions: CompileOptions | undefined;
    await buildResume(
      { source: 'resume.json' },
      {
        cwd: root,
        configEnvironment: { homeDir: root },
        compile: async (options) => {
          compileOptions = options;
          return fakeCompile(options);
        },
      },
    );

    expect(JSON.parse(compileOptions?.resumeJson ?? '{}').basics.photo).toBe(
      'project/assets/profile.png',
    );
    expect(compileOptions?.projectAssets).toEqual([
      {
        path: 'project/assets/profile.png',
        bytes: new Uint8Array([137, 80, 78, 71]),
      },
    ]);
  });

  test('mounts only custom contact icons referenced by resume data', async () => {
    const root = temporaryDirectory();
    mkdirSync(resolve(root, 'assets'));
    writeFileSync(resolve(root, 'assets', 'contact.svg'), '<svg></svg>');
    writeFileSync(
      resolve(root, 'resume.json'),
      JSON.stringify({
        ...minimalResume,
        basics: {
          ...minimalResume.basics,
          contacts: [{ icon: 'assets/contact.svg', text: 'Example' }],
        },
      }),
    );
    let compileOptions: CompileOptions | undefined;
    await buildResume(
      { source: 'resume.json' },
      {
        cwd: root,
        configEnvironment: { homeDir: root },
        compile: async (options) => {
          compileOptions = options;
          return fakeCompile(options);
        },
      },
    );

    expect(JSON.parse(compileOptions?.resumeJson ?? '{}').basics.contacts[0].icon).toBe(
      'project/assets/contact.svg',
    );
    expect(compileOptions?.projectAssets?.[0]?.path).toBe('project/assets/contact.svg');
  });

  test('rejects missing and out-of-project photo paths', async () => {
    const root = temporaryDirectory();
    const resumePath = resolve(root, 'resume.json');
    writeFileSync(
      resumePath,
      JSON.stringify({
        ...minimalResume,
        basics: { ...minimalResume.basics, photo: 'missing.png' },
      }),
    );
    await expect(
      buildResume(
        { source: 'resume.json' },
        { cwd: root, configEnvironment: { homeDir: root }, compile: fakeCompile },
      ),
    ).rejects.toMatchObject({ exitCode: ExitCode.inputRead });

    writeFileSync(
      resumePath,
      JSON.stringify({
        ...minimalResume,
        basics: { ...minimalResume.basics, photo: '../photo.png' },
      }),
    );
    await expect(
      buildResume(
        { source: 'resume.json' },
        { cwd: root, configEnvironment: { homeDir: root }, compile: fakeCompile },
      ),
    ).rejects.toMatchObject({ exitCode: ExitCode.inputRead });
  });

  test('project strict can be overridden and reports missing template fields', async () => {
    const root = temporaryDirectory();
    writeFileSync(resolve(root, 'resume.json'), JSON.stringify(minimalResume));
    writeTemplate(resolve(root, 'custom'), 'custom', 'basics.title');
    writeFileSync(
      resolve(root, 'typsume.config.toml'),
      'template = "./custom"\n[build]\nstrict = true\n',
    );

    await expect(
      buildResume(
        { source: 'resume.json' },
        { cwd: root, configEnvironment: { homeDir: root }, compile: fakeCompile },
      ),
    ).rejects.toMatchObject({ exitCode: ExitCode.schema });
    await expect(
      buildResume(
        { source: 'resume.json', strict: false },
        { cwd: root, configEnvironment: { homeDir: root }, compile: fakeCompile },
      ),
    ).resolves.toMatchObject({ bytes: 4 });
  });

  test('custom templates override built-in names and missing templates use exit code 5', () => {
    const root = temporaryDirectory();
    const customRoot = resolve(root, 'templates');
    writeTemplate(resolve(customRoot, 'default'), 'default');
    mkdirSync(resolve(root, 'xdg', 'typsume'), { recursive: true });
    writeFileSync(
      resolve(root, 'xdg', 'typsume', 'config.toml'),
      'templates-dir = "~/templates"\n',
    );
    const templates = listTemplates(root, { homeDir: root, xdgConfigHome: resolve(root, 'xdg') });
    expect(templates.filter((template) => template.name === 'default')).toHaveLength(1);
    expect(templates.find((template) => template.name === 'default')?.display).toBe('default');

    writeFileSync(resolve(root, 'resume.json'), JSON.stringify(minimalResume));
    return expect(
      buildResume(
        { source: 'resume.json', template: 'missing' },
        { cwd: root, homeDir: root, configEnvironment: { homeDir: root } },
      ),
    ).rejects.toEqual(
      expect.objectContaining<TypsumeError>({ exitCode: ExitCode.templateNotFound }),
    );
  });
});
