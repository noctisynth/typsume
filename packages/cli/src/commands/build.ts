import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { ResumeSchema } from '@typst-resume/core/schema';
import { defineCommand } from 'citty';
import { compileWithTemplate } from '../compiler.ts';
import { loadConfig } from '../config.ts';
import { ExitCode, TypsumeError } from '../errors.ts';
import { parseSource } from '../format.ts';
import { resolveTemplate } from '../resolver.ts';
import { handleErrors } from '../utils.ts';

export default defineCommand({
  meta: { name: 'build', description: 'Compile resume source to PDF' },
  args: {
    source: {
      type: 'positional',
      required: true,
      description: 'JSON / YAML / TOML source file',
    },
    template: {
      type: 'string',
      alias: 't',
      description: 'Template name or path',
    },
    output: {
      type: 'string',
      alias: 'o',
      description: 'Output PDF path (default: <source-stem>.pdf)',
    },
    strict: {
      type: 'boolean',
      default: false,
      description: 'Strict check of template requiredFields',
    },
    'dry-run': {
      type: 'boolean',
      default: false,
      description: 'Only validate + dump intermediate JSON',
    },
  },
  run: handleErrors(async ({ args }) => {
    const cwd = process.cwd();
    const sourcePath = resolve(cwd, args.source);

    // 1. Read + parse
    let data: unknown;
    try {
      const result = parseSource(sourcePath);
      data = result.data;
    } catch (err) {
      throw new TypsumeError(
        `Failed to read/parse source: ${(err as Error).message}`,
        ExitCode.parse,
      );
    }

    // 2. Validate schema
    const parsed = ResumeSchema.safeParse(data);
    if (parsed.error) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      const msg = issues.map((e) => `  ✗ ${e.path}\n    ${e.message}`).join('\n');
      throw new TypsumeError(`Schema validation failed:\n${msg}`, ExitCode.schema);
    }

    // 3. Resolve template
    const config = loadConfig(cwd);
    const resolved = resolveTemplate(args.template, config);

    // 4. Strict mode check
    if (args.strict) {
      const required = resolved.meta['required-fields'] ?? [];
      for (const field of required) {
        const parts = field.split('.');
        let val: unknown = parsed.data;
        for (const p of parts) {
          val = (val as Record<string, unknown>)?.[p];
        }
        if (val === undefined || val === null) {
          throw new TypsumeError(
            `Missing required field "${field}" (declared by template "${resolved.meta.name}")`,
            ExitCode.schema,
          );
        }
      }
    }

    // 5. Dry-run: dump normalized JSON
    if (args['dry-run']) {
      const json = JSON.stringify(parsed.data, null, 2);
      const stem = args.source.replace(/\.[^.]+$/, '');
      const dumpPath = resolve(cwd, `${stem}-normalized.json`);
      mkdirSync(dirname(dumpPath), { recursive: true });
      writeFileSync(dumpPath, json, 'utf-8');
      console.log(`Dry-run OK. Normalized data written to ${dumpPath}`);
      return;
    }

    // 6. Build config for compiler
    const cfg = resolved.meta.config ?? {};
    const colors = {
      theme: (cfg['theme-color'] as string) ?? '#0b628b',
      main: (cfg['main-color'] as string) ?? '#343434',
      secondary: (cfg['secondary-color'] as string) ?? '#808080',
      link: (cfg['link-color'] as string) ?? '#1e6485',
      icon: (cfg['icon-color'] as string) ?? '#0b628b',
    };
    const fonts = {
      main: (cfg.font as string) ?? 'Maple Mono NF',
      mono: (cfg['mono-font'] as string) ?? 'Maple Mono NF',
    };
    const sizes = {
      font: (cfg['font-size'] as number) ?? 10,
      heading: (cfg['heading-size'] as number) ?? 13,
      list: (cfg['list-size'] as number) ?? 8.5,
      item_title: (cfg['item-title-size'] as number) ?? 11,
    };
    const layout = {
      margin_top: (cfg['margin-top'] as string) ?? '1.5cm',
      margin_bottom: (cfg['margin-bottom'] as string) ?? '1.5cm',
      margin_left: (cfg['margin-left'] as string) ?? '1.5cm',
      margin_right: (cfg['margin-right'] as string) ?? '1.5cm',
      gutter_width: (cfg['gutter-width'] as string) ?? '2em',
      side_width: (cfg['side-width'] as string) ?? '12em',
    };

    // 7. Compile
    const result = await compileWithTemplate({
      templateDir: resolved.dir,
      resumeJson: JSON.stringify(parsed.data),
      config: { colors, fonts, sizes, layout },
    });

    // 8. Write output
    const stem = args.source.replace(/\.[^.]+$/, '');
    const outputPath = args.output ? resolve(cwd, args.output) : resolve(cwd, `${stem}.pdf`);

    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, result.pdf);
    console.log(`OK: ${outputPath} (${result.bytes} bytes)`);
  }),
});
