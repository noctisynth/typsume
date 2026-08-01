import { type ResumeOutput, ResumeSchema } from '@typsume/core/schema';
import { ExitCode, formatZodIssues, TypsumeError } from './errors.ts';
import { parseSource } from './format.ts';

export function loadResume(sourcePath: string): ResumeOutput {
  const result = ResumeSchema.safeParse(parseSource(sourcePath).data);
  if (!result.success) {
    throw new TypsumeError(
      `Schema validation failed:\n${formatZodIssues(result.error.issues)}`,
      ExitCode.schema,
    );
  }
  return result.data;
}

export function getRequiredField(data: unknown, path: string): unknown {
  let value = data;
  for (const segment of path.split('.')) {
    if (typeof value !== 'object' || value === null) return undefined;
    value = (value as Record<string, unknown>)[segment];
  }
  return value;
}
