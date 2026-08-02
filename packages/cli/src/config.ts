import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { parse } from '@iarna/toml';
import { TemplateConfigOverridesSchema } from '@typsume/core';
import { z } from 'zod';
import { ExitCode, formatZodIssues, TypsumeError } from './errors.ts';

const ProjectConfigSchema = z
  .object({
    template: z.string().min(1).optional(),
    output: z.string().min(1).optional(),
    build: z
      .object({
        strict: z.boolean().optional(),
        'font-paths': z.array(z.string().min(1)).optional(),
      })
      .strict()
      .optional(),
    config: TemplateConfigOverridesSchema.optional(),
  })
  .strict();

const GlobalConfigSchema = z.object({ 'templates-dir': z.string().min(1).optional() }).strict();

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;

export interface LoadedConfig {
  project: ProjectConfig | null;
  global: GlobalConfig | null;
  projectPath: string;
  globalPath: string;
}

export interface ConfigEnvironment {
  homeDir?: string;
  xdgConfigHome?: string;
}

export function expandHomePath(value: string, homeDir = homedir()): string {
  if (value === '~') return homeDir;
  if (value.startsWith('~/')) return resolve(homeDir, value.slice(2));
  return value;
}

export function getGlobalConfigPath(environment: ConfigEnvironment = {}): string {
  const homeDir = environment.homeDir ?? homedir();
  const configRoot = environment.xdgConfigHome
    ? expandHomePath(environment.xdgConfigHome, homeDir)
    : resolve(homeDir, '.config');
  return resolve(configRoot, 'typsume', 'config.toml');
}

function parseConfigFile<T>(filePath: string, schema: z.ZodType<T>): T | null {
  if (!existsSync(filePath)) return null;

  let value: unknown;
  try {
    value = parse(readFileSync(filePath, 'utf-8'));
  } catch (error) {
    throw new TypsumeError(
      `Failed to parse configuration ${filePath}: ${(error as Error).message}`,
      ExitCode.parse,
    );
  }

  const result = schema.safeParse(value);
  if (!result.success) {
    throw new TypsumeError(
      `Invalid configuration ${filePath}:\n${formatZodIssues(result.error.issues)}`,
      ExitCode.schema,
    );
  }
  return result.data;
}

export function loadConfig(projectRoot: string, environment: ConfigEnvironment = {}): LoadedConfig {
  const projectPath = resolve(projectRoot, 'typsume.config.toml');
  const globalPath = getGlobalConfigPath(environment);
  return {
    project: parseConfigFile(projectPath, ProjectConfigSchema),
    global: parseConfigFile(globalPath, GlobalConfigSchema),
    projectPath,
    globalPath,
  };
}
