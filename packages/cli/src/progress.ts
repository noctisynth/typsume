import { spinner } from '@clack/prompts';
import { logger } from './logger.ts';

export interface BuildProgressIndicator {
  start(message: string): void;
  message(message: string): void;
  stop(message: string): void;
  error(message: string): void;
  suspend(): void;
  resume(message: string): void;
}

interface ProgressOptions {
  interactive?: boolean;
  environment?: Record<string, string | undefined>;
}

export function createBuildProgress(options: ProgressOptions = {}): BuildProgressIndicator {
  const environment = options.environment ?? Bun.env;
  const interactive =
    options.interactive ??
    Boolean(
      process.stderr.isTTY && environment.CI !== 'true' && environment.GITHUB_ACTIONS !== 'true',
    );

  if (interactive) {
    const indicator = spinner({ output: process.stderr });
    return {
      start: (message) => indicator.start(message),
      message: (message) => indicator.message(message),
      stop: (message) => indicator.stop(message),
      error: (message) => indicator.error(message),
      suspend: () => indicator.clear(),
      resume: (message) => indicator.start(message),
    };
  }

  return {
    start: (message) => logger.start(message),
    message: (message) => logger.info(message),
    stop: (message) => logger.success(message),
    error: (message) => logger.error(message),
    suspend: () => {},
    resume: () => {},
  };
}
