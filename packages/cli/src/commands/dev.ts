import { watch } from 'node:fs';
import { resolve } from 'node:path';
import { defineCommand } from 'citty';

export default defineCommand({
  meta: { name: 'dev', description: 'Watch source file and rebuild on change' },
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
      description: 'Output PDF path',
    },
  },
  run({ args }) {
    const sourcePath = resolve(process.cwd(), args.source);
    console.log(`Watching ${sourcePath} for changes...`);

    let timeout: ReturnType<typeof setTimeout> | null = null;
    const watcher = watch(sourcePath, (event) => {
      if (event !== 'change') return;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(async () => {
        const start = Date.now();
        try {
          // Dynamically import and run the build command
          const build = await import('./build.ts');
          await build.default.run({
            source: args.source,
            template: args.template,
            output: args.output,
            strict: false,
            'dry-run': false,
          });
          console.log(`[${new Date().toLocaleTimeString()}] Rebuilt in ${Date.now() - start}ms`);
        } catch (err) {
          console.error(
            `[${new Date().toLocaleTimeString()}] Build failed: ${(err as Error).message}`,
          );
        }
      }, 300);
    });

    process.on('SIGINT', () => {
      watcher.close();
      process.exit(0);
    });
  },
});
