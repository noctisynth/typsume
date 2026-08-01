import { resolve } from 'node:path';
import { defineCommand } from 'citty';
import { loadResume } from '../resume.ts';
import { handleErrors } from '../utils.ts';

export default defineCommand({
  meta: { name: 'validate', description: 'Validate resume source against schema' },
  args: {
    source: {
      type: 'positional',
      required: true,
      description: 'JSON / YAML / TOML source file',
    },
  },
  run: handleErrors(async ({ args }) => {
    const sourcePath = resolve(process.cwd(), args.source);

    loadResume(sourcePath);

    console.log('OK: schema validation passed');
  }),
});
