import { cpSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve(import.meta.dirname, '../../../templates');
const target = resolve(import.meta.dirname, '../templates');
const mode = Bun.argv[2];

if (mode === 'stage') {
  if (!existsSync(source)) throw new Error(`Built-in templates source not found: ${source}`);
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
} else if (mode === 'clean') {
  rmSync(target, { recursive: true, force: true });
} else {
  throw new Error('Expected package template mode: stage or clean');
}
