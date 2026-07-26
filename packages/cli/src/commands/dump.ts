import { resolve } from 'node:path';
import { ResumeSchema } from '@typst-resume/core/schema';
import { defineCommand } from 'citty';
import { ExitCode, TypsumeError } from '../errors.ts';
import { parseSource } from '../format.ts';
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

    let data: unknown;
    try {
      data = parseSource(sourcePath).data;
    } catch (err) {
      throw new TypsumeError(
        `Failed to read/parse source: ${(err as Error).message}`,
        ExitCode.parse,
      );
    }

    const parsed = ResumeSchema.safeParse(data);
    if (parsed.error) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      const msg = issues.map((e) => `  ✗ ${e.path}\n    ${e.message}`).join('\n');
      throw new TypsumeError(`Schema validation failed:\n${msg}`, ExitCode.schema);
    }

    console.log(JSON.stringify(parsed.data, null, 2));
  }),
});
