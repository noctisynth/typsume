import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import type { LoadedConfig } from './config.ts';
import type { MetaToml } from './meta.ts';
import { readMeta } from './meta.ts';

// built-in templates live at <repo-root>/templates/<name>/
// packages/cli/src/resolver.ts -> ../../../
const BUILT_IN_ROOT = resolve(import.meta.dirname, '../../../templates');

export interface ResolvedTemplate {
  /** Absolute path to the template directory */
  dir: string;
  /** Parsed meta.toml */
  meta: MetaToml;
}

export function resolveTemplate(
  /** Value of -t / --template flag, if any */
  flag: string | undefined,
  config: LoadedConfig,
  /** Template name to look up (from meta field, etc.) */
  name?: string,
  projectRoot = process.cwd(),
): ResolvedTemplate {
  const candidate = flag ?? config.project?.template ?? config.global?.template;

  if (candidate) {
    // 1. Try as an absolute or relative path
    const relativeBase = flag ? process.cwd() : projectRoot;
    const asPath = isAbsolute(candidate) ? candidate : resolve(relativeBase, candidate);
    if (existsSync(asPath) && existsSync(resolve(asPath, 'meta.toml'))) {
      return { dir: asPath, meta: readMeta(asPath) };
    }

    // 2. Try as a built-in template name
    const builtIn = resolve(BUILT_IN_ROOT, candidate);
    if (existsSync(builtIn) && existsSync(resolve(builtIn, 'meta.toml'))) {
      return { dir: builtIn, meta: readMeta(builtIn) };
    }
  }

  // 3. Fall back to built-in default
  const fallback = resolve(BUILT_IN_ROOT, name ?? 'default');
  if (!existsSync(fallback)) {
    throw new Error(`Template not found: searched built-in templates at ${BUILT_IN_ROOT}`);
  }
  return { dir: fallback, meta: readMeta(fallback) };
}
