import { consola } from 'consola';

export const logger = consola;

export function writeOutput(value: string): void {
  process.stdout.write(value.endsWith('\n') ? value : `${value}\n`);
}
