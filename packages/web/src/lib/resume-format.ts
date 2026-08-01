import { type ResumeData, ResumeSchema } from '@typsume/core';
import { load as parseYaml, dump as stringifyYaml } from 'js-yaml';
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml';

export type ResumeSourceFormat = 'json' | 'yaml' | 'toml';

export function detectResumeFormat(fileName: string): ResumeSourceFormat {
  const extension = fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase();
  if (extension === 'yaml' || extension === 'yml') return 'yaml';
  if (extension === 'toml') return 'toml';
  if (extension === 'json') return 'json';
  throw new Error('Unsupported resume format. Choose a JSON, YAML, or TOML file.');
}

export function parseResumeSource(source: string, format: ResumeSourceFormat): ResumeData {
  let value: unknown;
  try {
    value =
      format === 'json'
        ? JSON.parse(source)
        : format === 'yaml'
          ? parseYaml(source)
          : parseToml(source);
  } catch (error) {
    throw new Error(
      `Unable to parse ${format.toUpperCase()}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const parsed = ResumeSchema.safeParse(value);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Resume schema validation failed:\n${details}`);
  }
  return parsed.data;
}

export function serializeResume(resume: ResumeData, format: ResumeSourceFormat): string {
  const normalized = ResumeSchema.parse(resume);
  if (format === 'json') return `${JSON.stringify(normalized, null, 2)}\n`;
  if (format === 'yaml') return stringifyYaml(normalized, { noRefs: true, lineWidth: 100 });
  return stringifyToml(JSON.parse(JSON.stringify(normalized)));
}
