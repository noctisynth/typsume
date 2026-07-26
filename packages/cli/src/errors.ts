export const ExitCode = {
  success: 0,
  general: 1,
  inputRead: 2,
  parse: 3,
  schema: 4,
  templateNotFound: 5,
  wasmInit: 6,
  compile: 7,
} as const;

export class TypsumeError extends Error {
  constructor(
    message: string,
    public exitCode: number = ExitCode.general,
  ) {
    super(message);
    this.name = 'TypsumeError';
  }
}

export function formatSchemaError(errors: { path: string; message: string }[]): string {
  return errors
    .map((e) => `  ✗ schema validation failed at ${e.path}\n    ${e.message}`)
    .join('\n');
}
