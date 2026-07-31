import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, parse, resolve } from 'node:path';

export function findProjectRoot(sourcePath: string): string {
  let current = dirname(resolve(sourcePath));
  const filesystemRoot = parse(current).root;

  while (true) {
    if (existsSync(resolve(current, 'typsume.config.toml'))) return current;
    if (current === filesystemRoot) return dirname(resolve(sourcePath));
    current = dirname(current);
  }
}

export function ensureProjectRuntime(projectRoot: string): string {
  const runtimeDir = resolve(projectRoot, '.typsume');
  const fontsDir = resolve(runtimeDir, 'fonts');
  mkdirSync(fontsDir, { recursive: true });

  const ignorePath = resolve(runtimeDir, '.gitignore');
  if (!existsSync(ignorePath)) writeFileSync(ignorePath, '*\n', 'utf-8');
  return fontsDir;
}
