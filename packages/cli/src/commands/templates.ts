import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineCommand } from 'citty';
import { ExitCode, TypsumeError } from '../errors.ts';
import { readMeta } from '../meta.ts';

const BUILT_IN_ROOT = resolve(import.meta.dirname, '../../../../templates');

export default defineCommand({
  meta: { name: 'templates', description: 'List available templates' },
  args: {
    json: {
      type: 'boolean',
      default: false,
      description: 'Output as JSON',
    },
  },
  run({ args }) {
    let entries: string[];
    try {
      entries = readdirSync(BUILT_IN_ROOT, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch {
      throw new TypsumeError('No built-in templates directory found', ExitCode.general);
    }

    const templates = entries
      .map((name) => {
        try {
          const meta = readMeta(resolve(BUILT_IN_ROOT, name));
          return {
            name: meta.name,
            display: meta['display-name'] ?? meta.name,
            required: meta['required-fields'] ?? [],
            theme: (meta.config?.['theme-color'] as string) ?? '',
          };
        } catch {
          return null;
        }
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    if (args.json) {
      console.log(JSON.stringify(templates, null, 2));
      return;
    }

    if (templates.length === 0) {
      console.log('No templates found.');
      return;
    }

    const rows = templates.map(
      (t) =>
        `${t.name.padEnd(14)}${t.display.padEnd(16)}${t.required.join(', ').padEnd(24)}${t.theme}`,
    );
    console.log(
      `${'NAME'.padEnd(14)}${'DISPLAY'.padEnd(16)}${'REQUIRED FIELDS'.padEnd(24)}THEME COLOR`,
    );
    console.log('-'.repeat(70));
    rows.forEach((r) => {
      console.log(r);
    });
  },
});
