import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineCommand } from 'citty';
import { type ConfigEnvironment, loadConfig } from '../config.ts';
import { formatDetail, formatPath, formatStage, logger, writeOutput } from '../logger.ts';
import { readMeta } from '../meta.ts';
import { getBuiltInTemplatesDir, getCustomTemplatesDir } from '../resolver.ts';
import { handleErrors } from '../utils.ts';

export interface TemplateSummary {
  name: string;
  display: string;
  required: string[];
  theme: string;
}

function readTemplateRoot(root: string): TemplateSummary[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      try {
        const directory = resolve(root, entry.name);
        if (!existsSync(resolve(directory, 'template.typ'))) return [];
        const meta = readMeta(directory);
        return [
          {
            name: meta.name,
            display: meta['display-name'] ?? meta.name,
            required: meta['required-fields'] ?? [],
            theme: (meta.config?.['theme-color'] as string) ?? '',
          },
        ];
      } catch {
        return [];
      }
    });
}

export function listTemplates(
  cwd = process.cwd(),
  environment: ConfigEnvironment = {},
): TemplateSummary[] {
  const config = loadConfig(cwd, environment);
  const templates = new Map<string, TemplateSummary>();
  for (const template of readTemplateRoot(getBuiltInTemplatesDir())) {
    templates.set(template.name, template);
  }
  const customRoot = getCustomTemplatesDir(config, environment.homeDir);
  if (customRoot) {
    for (const template of readTemplateRoot(customRoot)) templates.set(template.name, template);
  }
  return [...templates.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export default defineCommand({
  meta: { name: 'templates', description: 'List available templates' },
  args: { json: { type: 'boolean', default: false, description: 'Output as JSON' } },
  run: handleErrors(async ({ args }) => {
    const templates = listTemplates();
    if (args.json) {
      writeOutput(JSON.stringify(templates, null, 2));
      return;
    }
    if (templates.length === 0) {
      logger.info('No templates found.');
      return;
    }
    logger.log(
      formatStage(
        `${'NAME'.padEnd(14)}${'DISPLAY'.padEnd(16)}${'REQUIRED FIELDS'.padEnd(24)}THEME COLOR`,
      ),
    );
    logger.log(formatDetail('-'.repeat(70)));
    for (const template of templates) {
      logger.log(
        `${formatPath(template.name.padEnd(14))}${template.display.padEnd(16)}${template.required.join(', ').padEnd(24)}${template.theme}`,
      );
    }
  }),
});
