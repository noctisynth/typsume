import { expect, test } from 'bun:test';
import { createDebouncedRebuild } from '../src/commands/dev.ts';

test('dev rebuild trigger debounces changes and reports a build failure', async () => {
  let builds = 0;
  await new Promise<void>((done, reject) => {
    const timeout = setTimeout(() => reject(new Error('debounced rebuild did not run')), 2000);
    const trigger = createDebouncedRebuild(
      async () => {
        builds += 1;
        throw new Error('expected failure');
      },
      ({ error }) => {
        clearTimeout(timeout);
        expect(error?.message).toBe('expected failure');
        done();
      },
      20,
    );
    trigger();
    trigger();
  });
  expect(builds).toBe(1);
});
