import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineCommand } from 'citty';
import { ExitCode } from '../errors.ts';
import { createFontDownloadConsent } from '../interaction.ts';
import { formatPath, logger } from '../logger.ts';
import { findProjectRoot } from '../project.ts';
import { type BuildOptions, buildWithFeedback } from './build.ts';

export interface WatchReport {
  durationMs: number;
  error?: Error;
}

export interface DevWatcher {
  close(): void;
}

function fileSnapshot(path: string): string {
  if (!existsSync(path)) return 'missing';
  const stat = statSync(path, { bigint: true });
  return `${stat.ino}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}`;
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
): DevWatcher {
  const watcher = watchFiles([sourcePath], rebuild, report, delayMs)[0];
  if (!watcher) throw new Error(`Unable to watch ${sourcePath}`);
  return watcher;
}

export function watchFiles(
  paths: string[],
  rebuild: () => Promise<void>,
  report: (result: WatchReport) => void,
  delayMs = 300,
): DevWatcher[] {
  const trigger = createDebouncedRebuild(rebuild, report, delayMs);
  return [...new Set(paths)].map((path) => {
    let previous = fileSnapshot(path);
    const interval = setInterval(() => {
      const current = fileSnapshot(path);
      if (current === previous) return;
      previous = current;
      trigger();
    }, 100);
    return { close: () => clearInterval(interval) };
  });
}

export async function startDevWatch(
  paths: string[],
  rebuild: () => Promise<void>,
  report: (result: WatchReport) => void,
  reportInitialError: (error: Error) => void,
  delayMs = 300,
): Promise<DevWatcher[]> {
  try {
    await rebuild();
  } catch (error) {
    reportInitialError(error as Error);
  }
  return watchFiles(paths, rebuild, report, delayMs);
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
  async run({ args }) {
    const sourcePath = resolve(process.cwd(), args.source);
    const configPath = resolve(findProjectRoot(sourcePath), 'typsume.config.toml');
    const buildOptions: BuildOptions = { source: args.source };
    if (args.template !== undefined) buildOptions.template = args.template;
    if (args.output !== undefined) buildOptions.output = args.output;
    const confirmFontDownload = createFontDownloadConsent({
      allowDownloads: args['allow-downloads'],
    });

    const watchers = await startDevWatch(
      [sourcePath, configPath],
      async () => {
        await buildWithFeedback(buildOptions, { confirmFontDownload });
      },
      ({ error }) => {
        if (error) logger.error(error.message);
      },
      (error) => logger.error(error.message),
    );
    logger.info(`Watching ${formatPath(sourcePath)} and ${formatPath(configPath)} for changes...`);

    process.on('SIGINT', () => {
      for (const watcher of watchers) watcher.close();
      process.exit(ExitCode.success);
    });
  },
});
