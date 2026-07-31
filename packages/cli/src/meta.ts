import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@iarna/toml';

export interface FontResource {
  urls: string[];
  integrity?: string;
}

export interface MetaToml {
  name: string;
  'display-name'?: string;
  description?: string;
  version?: string;
  author?: string;
  license?: string;
  page?: string;
  'required-fields'?: string[];
  'optional-fields'?: string[];
  config?: Record<string, unknown>;
  resources?: {
    fonts?: FontResource[];
  };
}

export function readMeta(templateDir: string): MetaToml {
  const raw = readFileSync(resolve(templateDir, 'meta.toml'), 'utf-8');
  return parse(raw) as unknown as MetaToml;
}
