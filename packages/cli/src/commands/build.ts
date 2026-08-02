import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { resolveTemplateConfig } from '@typsume/core';
import { defineCommand } from 'citty';
import { type CompileOptions, type CompileResult, compileWithTemplate } from '../compiler.ts';
import { type ConfigEnvironment, loadConfig } from '../config.ts';
import { ExitCode, TypsumeError } from '../errors.ts';
import { createFontDownloadConsent } from '../interaction.ts';
import { formatDetail, formatPath, formatResult, formatStage, logger } from '../logger.ts';
import { createBuildProgress } from '../progress.ts';
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
  reportProgress?: (message: string) => void | Promise<void>;
  confirmFontDownload?: () => Promise<boolean>;
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

function loadProjectAsset(projectRoot: string, assetPath: string, label: string) {
  if (isAbsolute(assetPath)) {
    throw new TypsumeError(
      `${label} path must be relative to the resume project root.`,
      ExitCode.inputRead,
    );
  }
  const absolutePath = resolve(projectRoot, assetPath);
  const projectPath = relative(projectRoot, absolutePath);
  if (projectPath === '..' || projectPath.startsWith(`..${sep}`) || isAbsolute(projectPath)) {
    throw new TypsumeError(
      `${label} path cannot leave the resume project root.`,
      ExitCode.inputRead,
    );
  }
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    throw new TypsumeError(`${label} file not found: ${assetPath}`, ExitCode.inputRead);
  }
  const normalizedPath = projectPath.split(sep).join('/');
  return {
    dataPath: `project/${normalizedPath}`,
    asset: { path: `project/${normalizedPath}`, bytes: readFileSync(absolutePath) },
  };
}

function isProjectIcon(icon: string) {
  return icon.includes('/') || /\.(?:png|svg)$/i.test(icon);
}

export async function buildResume(
  options: BuildOptions,
  context: BuildContext = {},
): Promise<BuildResult> {
  const cwd = context.cwd ?? process.cwd();
  const sourcePath = resolve(cwd, options.source);
  await context.reportProgress?.('Reading configuration and validating resume data');
  const projectRoot = findProjectRoot(sourcePath);
  const config = loadConfig(projectRoot, context.configEnvironment);
  const data = loadResume(sourcePath);
  const projectPhoto = data.basics.photo
    ? loadProjectAsset(projectRoot, data.basics.photo, 'Photo')
    : null;
  await context.reportProgress?.('Resolving the resume template');
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

  const renderConfig = resolveTemplateConfig(resolved.meta.config, config.project?.config);
  const compileData = structuredClone(data);
  const projectAssets: NonNullable<CompileOptions['projectAssets']> = [];
  if (projectPhoto) compileData.basics.photo = projectPhoto.dataPath;
  if (projectPhoto) projectAssets.push(projectPhoto.asset);
  for (const contact of compileData.basics.contacts) {
    if (!isProjectIcon(contact.icon)) continue;
    const projectIcon = loadProjectAsset(projectRoot, contact.icon, 'Contact icon');
    contact.icon = projectIcon.dataPath;
    projectAssets.push(projectIcon.asset);
  }

  const compile = context.compile ?? compileWithTemplate;
  const compileOptions: CompileOptions = {
    templateDir: resolved.dir,
    resumeJson: JSON.stringify(compileData),
    fontCacheDir: ensureProjectRuntime(projectRoot),
    fontResources: resolved.meta.resources?.fonts ?? [],
    config: renderConfig,
  };
  if (projectAssets.length > 0) compileOptions.projectAssets = projectAssets;
  if (context.reportProgress) compileOptions.reportProgress = context.reportProgress;
  if (context.confirmFontDownload) compileOptions.confirmFontDownload = context.confirmFontDownload;
  const result = await compile(compileOptions);

  const configuredOutput = config.project?.output;
  const outputPath = options.output
    ? resolve(cwd, options.output)
    : configuredOutput
      ? resolve(projectRoot, configuredOutput)
      : sourceOutputPath(sourcePath);
  mkdirSync(dirname(outputPath), { recursive: true });
  await context.reportProgress?.('Writing the generated PDF');
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
    'allow-downloads': {
      type: 'boolean',
      default: false,
      description: 'Allow remote font downloads without prompting',
    },
  },
  run: handleErrors(async ({ args }) => {
    const progress = createBuildProgress();
    const confirmFontDownload = createFontDownloadConsent({
      allowDownloads: args['allow-downloads'],
    });
    progress.start(`Building ${formatPath(args.source)}`);
    await progress.render();
    try {
      const result = await buildResume(
        {
          source: args.source,
          template: args.template,
          output: args.output,
          strict: args.strict,
          dryRun: args['dry-run'],
        },
        {
          reportProgress: async (message) => {
            progress.message(formatStage(message));
            await progress.render();
          },
          confirmFontDownload: async () => {
            progress.suspend();
            try {
              return await confirmFontDownload();
            } finally {
              progress.resume(formatStage('Loading font resources'));
            }
          },
        },
      );
      const displayedOutput = relative(process.cwd(), result.outputPath) || '.';
      progress.stop(result.dryRun ? 'Validation complete' : 'Compilation complete');
      const detail = result.dryRun ? '' : ` ${formatDetail(`(${result.bytes} bytes)`)}`;
      logger.success(`Output: ${formatResult(displayedOutput)}${detail}`);
    } catch (error) {
      progress.error('Build failed');
      throw error;
    }
  }),
});
