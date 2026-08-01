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

function formatPath(path: readonly PropertyKey[]): string {
  if (path.length === 0) return '<root>';
  return path.reduce<string>((result, segment) => {
    if (typeof segment === 'number') return `${result}[${segment}]`;
    return result ? `${result}.${String(segment)}` : String(segment);
  }, '');
}

export function formatZodIssues(
  errors: readonly { path: readonly PropertyKey[]; message: string }[],
): string {
  return errors.map((error) => `  ✗ ${formatPath(error.path)}\n    ${error.message}`).join('\n');
}
