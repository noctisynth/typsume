import { bold, cyan, dim, green } from 'colorette';
import { consola } from 'consola';

export const logger = consola;
export const formatPath = cyan;
export const formatStage = bold;
export const formatResult = green;
export const formatDetail = dim;

export function writeOutput(value: string): void {
  process.stdout.write(value.endsWith('\n') ? value : `${value}\n`);
}
