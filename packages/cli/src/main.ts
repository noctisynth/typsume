#!/usr/bin/env bun
import { defineCommand, runMain } from 'citty';
import build from './commands/build.ts';
import dev from './commands/dev.ts';
import dump from './commands/dump.ts';
import init from './commands/init.ts';
import templates from './commands/templates.ts';
import validate from './commands/validate.ts';
import { ExitCode, TypsumeError } from './errors.ts';
import { logger } from './logger.ts';

const main = defineCommand({
  meta: {
    name: 'typsume',
    version: '0.1.0',
    description:
      'Data-driven Typst resume compiler. JSON/YAML/TOML → PDF via WASM (no system typst needed).',
  },
  subCommands: { build, validate, dump, templates, init, dev },
});

await runMain(main).catch((err: unknown) => {
  if (err instanceof TypsumeError) {
    logger.error(err.message);
    process.exit(err.exitCode);
  }
  logger.error(`Unexpected error: ${(err as Error).message}`);
  process.exit(ExitCode.general);
});
