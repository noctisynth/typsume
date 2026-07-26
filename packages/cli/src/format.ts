import { readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { parse as parseToml } from '@iarna/toml';
import { load as parseYaml } from 'js-yaml';

export type SourceFormat = 'json' | 'yaml' | 'toml';

export function detectFormat(filePath: string): SourceFormat {
  const ext = extname(filePath).toLowerCase();
  if (ext === '.yaml' || ext === '.yml') return 'yaml';
  if (ext === '.toml') return 'toml';
  return 'json';
}

export function parseSource(filePath: string): { data: unknown; format: SourceFormat } {
  const format = detectFormat(filePath);
  const raw = readFileSync(resolve(filePath), 'utf-8');

  switch (format) {
    case 'json':
      return { data: JSON.parse(raw), format };
    case 'yaml':
      return { data: parseYaml(raw), format };
    case 'toml':
      return { data: parseToml(raw), format };
  }
}
