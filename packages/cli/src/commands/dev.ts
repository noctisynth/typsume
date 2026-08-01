import { type FSWatcher, watch } from 'node:fs';
import { resolve } from 'node:path';
import { defineCommand } from 'citty';
import { ExitCode } from '../errors.ts';
import { createFontDownloadConsent } from '../interaction.ts';
import { formatDetail, formatPath, formatStage, logger } from '../logger.ts';
import { type BuildOptions, buildResume } from './build.ts';

export interface WatchReport {
  durationMs: number;
  error?: Error;
}

export function createDebouncedRebuild(
  rebuild: () => Promise<void>,
  report: (result: WatchReport) => void,
  delayMs = 300,
): () => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(async () => {
      const start = Date.now();
      try {
        await rebuild();
        report({ durationMs: Date.now() - start });
      } catch (error) {
        report({ durationMs: Date.now() - start, error: error as Error });
      }
    }, delayMs);
  };
}

export function watchSource(
  sourcePath: string,
  rebuild: () => Promise<void>,
  report: (result: WatchReport) => void,
  delayMs = 300,
): FSWatcher {
  return watch(sourcePath, createDebouncedRebuild(rebuild, report, delayMs));
}

export default defineCommand({
  meta: { name: 'dev', description: 'Watch source file and rebuild on change' },
  args: {
    source: { type: 'positional', required: true, description: 'JSON / YAML / TOML source file' },
    template: { type: 'string', alias: 't', description: 'Template name or path' },
    output: { type: 'string', alias: 'o', description: 'Output PDF path' },
    'allow-downloads': {
      type: 'boolean',
      default: false,
      description: 'Allow remote font downloads without prompting',
    },
  },
  run({ args }) {
    const sourcePath = resolve(process.cwd(), args.source);
    logger.info(`Watching ${formatPath(sourcePath)} for changes...`);
    const buildOptions: BuildOptions = { source: args.source };
    if (args.template !== undefined) buildOptions.template = args.template;
    if (args.output !== undefined) buildOptions.output = args.output;
    const confirmFontDownload = createFontDownloadConsent({
      allowDownloads: args['allow-downloads'],
    });

    const watcher = watchSource(
      sourcePath,
      async () => {
        await buildResume(buildOptions, {
          reportProgress: (message) => logger.success(formatStage(message)),
          confirmFontDownload,
        });
      },
      ({ durationMs, error }) => {
        const timestamp = new Date().toLocaleTimeString();
        if (error) logger.error(`[${timestamp}] Build failed: ${error.message}`);
        else
          logger.success(
            `${formatDetail(`[${timestamp}]`)} Rebuilt in ${formatDetail(`${durationMs}ms`)}`,
          );
      },
    );

    process.on('SIGINT', () => {
      watcher.close();
      process.exit(ExitCode.success);
    });
  },
});
