import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@iarna/toml';
import { z } from 'zod';
import { ExitCode, formatZodIssues, TypsumeError } from './errors.ts';

const FontResourceSchema = z.object({
  urls: z.array(z.url()).min(1),
  integrity: z
    .string()
    .regex(/^sha256-[A-Za-z0-9+/]+={0,2}$/)
    .optional(),
});

const MetaTomlSchema = z
  .object({
    name: z.string().min(1),
    'display-name': z.string().optional(),
    description: z.string().optional(),
    version: z.string().optional(),
    author: z.string().optional(),
    license: z.string().optional(),
    page: z.string().optional(),
    'required-fields': z.array(z.string()).optional(),
    'optional-fields': z.array(z.string()).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    resources: z
      .object({ fonts: z.array(FontResourceSchema).optional() })
      .strict()
      .optional(),
  })
  .strict();

export type FontResource = z.infer<typeof FontResourceSchema>;
export type MetaToml = z.infer<typeof MetaTomlSchema>;

export function readMeta(templateDir: string): MetaToml {
  const metaPath = resolve(templateDir, 'meta.toml');
  let value: unknown;
  try {
    value = parse(readFileSync(metaPath, 'utf-8'));
  } catch (error) {
    throw new TypsumeError(
      `Failed to parse template metadata ${metaPath}: ${(error as Error).message}`,
      ExitCode.parse,
    );
  }
  const result = MetaTomlSchema.safeParse(value);
  if (!result.success) {
    throw new TypsumeError(
      `Invalid template metadata ${metaPath}:\n${formatZodIssues(result.error.issues)}`,
      ExitCode.schema,
    );
  }
  return result.data;
}
