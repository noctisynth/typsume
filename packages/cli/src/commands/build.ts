import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { defineCommand } from 'citty';
import { type CompileOptions, type CompileResult, compileWithTemplate } from '../compiler.ts';
import { type ConfigEnvironment, loadConfig } from '../config.ts';
import { ExitCode, TypsumeError } from '../errors.ts';
import { ensureProjectRuntime, findProjectRoot } from '../project.ts';
import { resolveTemplate } from '../resolver.ts';
import { getRequiredField, loadResume } from '../resume.ts';
import { handleErrors } from '../utils.ts';

export interface BuildOptions {
  source: string;
  template?: string;
  output?: string;
  strict?: boolean;
  dryRun?: boolean;
}

export interface BuildContext {
  cwd?: string;
  homeDir?: string;
  configEnvironment?: ConfigEnvironment;
  compile?: (options: CompileOptions) => Promise<CompileResult>;
}

export interface BuildResult {
  outputPath: string;
  bytes: number;
  dryRun: boolean;
}

function sourceOutputPath(sourcePath: string): string {
  const extension = extname(sourcePath);
  return extension ? `${sourcePath.slice(0, -extension.length)}.pdf` : `${sourcePath}.pdf`;
}

export async function buildResume(
  options: BuildOptions,
  context: BuildContext = {},
): Promise<BuildResult> {
  const cwd = context.cwd ?? process.cwd();
  const sourcePath = resolve(cwd, options.source);
  const projectRoot = findProjectRoot(sourcePath);
  const config = loadConfig(projectRoot, context.configEnvironment);
  const data = loadResume(sourcePath);
  const resolved = resolveTemplate(options.template, config, projectRoot, cwd, context.homeDir);

  const strict = options.strict ?? config.project?.build?.strict ?? false;
  if (strict) {
    for (const field of resolved.meta['required-fields'] ?? []) {
      const value = getRequiredField(data, field);
      if (value === undefined || value === null || value === '') {
        throw new TypsumeError(
          `Missing required field "${field}" (declared by template "${resolved.meta.name}")`,
          ExitCode.schema,
        );
      }
    }
  }

  if (options.dryRun) {
    const normalizedPath = `${sourcePath.slice(0, sourcePath.length - extname(sourcePath).length)}-normalized.json`;
    writeFileSync(normalizedPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
    return { outputPath: normalizedPath, bytes: 0, dryRun: true };
  }

  const cfg = resolved.meta.config ?? {};
  const colors = {
    theme: (cfg['theme-color'] as string) ?? '#0b628b',
    main: (cfg['main-color'] as string) ?? '#343434',
    secondary: (cfg['secondary-color'] as string) ?? '#808080',
    link: (cfg['link-color'] as string) ?? '#1e6485',
    icon: (cfg['icon-color'] as string) ?? '#0b628b',
  };
  const fonts = {
    main: (cfg.font as string) ?? 'Maple Mono NF',
    mono: (cfg['mono-font'] as string) ?? 'Maple Mono NF',
  };
  const sizes = {
    font: (cfg['font-size'] as number) ?? 10,
    heading: (cfg['heading-size'] as number) ?? 13,
    list: (cfg['list-size'] as number) ?? 8.5,
    item_title: (cfg['item-title-size'] as number) ?? 11,
  };
  const layout = {
    margin_top: (cfg['margin-top'] as string) ?? '1.5cm',
    margin_bottom: (cfg['margin-bottom'] as string) ?? '1.5cm',
    margin_left: (cfg['margin-left'] as string) ?? '1.5cm',
    margin_right: (cfg['margin-right'] as string) ?? '1.5cm',
    gutter_width: (cfg['gutter-width'] as string) ?? '2em',
    side_width: (cfg['side-width'] as string) ?? '12em',
  };

  const compile = context.compile ?? compileWithTemplate;
  const result = await compile({
    templateDir: resolved.dir,
    resumeJson: JSON.stringify(data),
    fontCacheDir: ensureProjectRuntime(projectRoot),
    fontResources: resolved.meta.resources?.fonts ?? [],
    config: { colors, fonts, sizes, layout },
  });

  const configuredOutput = config.project?.output;
  const outputPath = options.output
    ? resolve(cwd, options.output)
    : configuredOutput
      ? resolve(projectRoot, configuredOutput)
      : sourceOutputPath(sourcePath);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, result.pdf);
  return { outputPath, bytes: result.bytes, dryRun: false };
}

export default defineCommand({
  meta: { name: 'build', description: 'Compile resume source to PDF' },
  args: {
    source: { type: 'positional', required: true, description: 'JSON / YAML / TOML source file' },
    template: { type: 'string', alias: 't', description: 'Template name or path' },
    output: { type: 'string', alias: 'o', description: 'Output PDF path' },
    strict: { type: 'boolean', description: 'Strict check of template requiredFields' },
    'dry-run': {
      type: 'boolean',
      default: false,
      description: 'Validate and dump normalized JSON',
    },
  },
  run: handleErrors(async ({ args }) => {
    const result = await buildResume({
      source: args.source,
      template: args.template,
      output: args.output,
      strict: args.strict,
      dryRun: args['dry-run'],
    });
    if (result.dryRun) console.log(`Dry-run OK. Normalized data written to ${result.outputPath}`);
    else console.log(`OK: ${result.outputPath} (${result.bytes} bytes)`);
  }),
});
