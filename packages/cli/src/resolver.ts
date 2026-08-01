import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { expandHomePath, type LoadedConfig } from './config.ts';
import { ExitCode, TypsumeError } from './errors.ts';
import type { MetaToml } from './meta.ts';
import { readMeta } from './meta.ts';

const PACKAGED_TEMPLATES_DIR = resolve(import.meta.dirname, '../templates');
const MONOREPO_TEMPLATES_DIR = resolve(import.meta.dirname, '../../../templates');

export function getBuiltInTemplatesDir(): string {
  return existsSync(PACKAGED_TEMPLATES_DIR) ? PACKAGED_TEMPLATES_DIR : MONOREPO_TEMPLATES_DIR;
}

export interface ResolvedTemplate {
  dir: string;
  meta: MetaToml;
}

function isTemplateDirectory(directory: string): boolean {
  return (
    existsSync(directory) &&
    existsSync(resolve(directory, 'meta.toml')) &&
    existsSync(resolve(directory, 'template.typ'))
  );
}

function resolveDirectory(directory: string): ResolvedTemplate | null {
  return isTemplateDirectory(directory) ? { dir: directory, meta: readMeta(directory) } : null;
}

export function getCustomTemplatesDir(config: LoadedConfig, homeDir?: string): string | null {
  const configured = config.global?.['templates-dir'];
  if (!configured) return null;
  return resolve(expandHomePath(configured, homeDir));
}

export function resolveTemplate(
  flag: string | undefined,
  config: LoadedConfig,
  projectRoot = process.cwd(),
  cwd = process.cwd(),
  homeDir?: string,
): ResolvedTemplate {
  const candidate = flag ?? config.project?.template ?? 'default';
  const pathBase = flag ? cwd : projectRoot;

  if (isAbsolute(candidate) || candidate.startsWith('.') || candidate.includes('/')) {
    const asPath = resolveDirectory(
      isAbsolute(candidate) ? candidate : resolve(pathBase, candidate),
    );
    if (asPath) return asPath;
    throw new TypsumeError(`Template not found at ${candidate}`, ExitCode.templateNotFound);
  }

  const customRoot = getCustomTemplatesDir(config, homeDir);
  if (customRoot) {
    const custom = resolveDirectory(resolve(customRoot, candidate));
    if (custom) return custom;
  }

  const builtIn = resolveDirectory(resolve(getBuiltInTemplatesDir(), candidate));
  if (builtIn) return builtIn;

  throw new TypsumeError(`Template not found: ${candidate}`, ExitCode.templateNotFound);
}
