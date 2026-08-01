import { ExitCode, TypsumeError } from './errors.ts';

/** Wrap a command handler so TypsumeError prints cleanly with the correct exit code. */
export function handleErrors<TContext>(
  fn: (context: TContext) => unknown | Promise<unknown>,
): (context: TContext) => Promise<void> {
  return async (context: TContext) => {
    try {
      await fn(context);
    } catch (err: unknown) {
      if (err instanceof TypsumeError) {
        console.error(err.message);
        process.exit(err.exitCode);
      }
      console.error(`Unexpected error: ${(err as Error).message}`);
      process.exit(ExitCode.general);
    }
  };
}
