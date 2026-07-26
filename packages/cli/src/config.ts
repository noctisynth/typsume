import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { parse } from '@iarna/toml';

export interface CliConfig {
  template?: string;
  output?: string;
  build?: {
    strict?: boolean;
  };
}

function parseTomlFile(filePath: string): Record<string, unknown> | null {
  if (!existsSync(filePath)) return null;
  const raw = readFileSync(filePath, 'utf-8');
  return parse(raw) as unknown as Record<string, unknown>;
}

const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME
  ? resolve(process.env.XDG_CONFIG_HOME, 'typsume', 'config.toml')
  : resolve(homedir(), '.config', 'typsume', 'config.toml');

export interface LoadedConfig {
  project: CliConfig | null;
  global: CliConfig | null;
}

export function loadConfig(cwd: string): LoadedConfig {
  const projectFile = resolve(cwd, 'typsume.config.toml');
  const project = parseTomlFile(projectFile) as CliConfig | null;
  const global = parseTomlFile(XDG_CONFIG_HOME) as CliConfig | null;
  return { project, global };
}
