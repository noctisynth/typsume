import { resolve } from 'node:path';
import { defineCommand } from 'citty';
import { writeOutput } from '../logger.ts';
import { loadResume } from '../resume.ts';
import { handleErrors } from '../utils.ts';

export default defineCommand({
  meta: { name: 'dump', description: 'Parse, validate, and print normalized JSON' },
  args: {
    source: {
      type: 'positional',
      required: true,
      description: 'JSON / YAML / TOML source file',
    },
  },
  run: handleErrors(async ({ args }) => {
    const sourcePath = resolve(process.cwd(), args.source);

    writeOutput(JSON.stringify(loadResume(sourcePath), null, 2));
  }),
});
