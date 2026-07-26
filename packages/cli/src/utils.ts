import { ExitCode, TypsumeError } from './errors.ts';

/** Wrap a command handler so TypsumeError prints cleanly with the correct exit code. */
export function handleErrors<T extends (...args: never[]) => unknown>(
  fn: T,
): (...args: Parameters<T>) => Promise<void> {
  return async (...args: Parameters<T>) => {
    try {
      await (fn(...args) as ReturnType<T>);
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
