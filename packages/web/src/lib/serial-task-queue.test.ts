import { describe, expect, test } from 'vitest';
import { createSerialTaskQueue } from './serial-task-queue';

describe('serial task queue', () => {
  test('never overlaps asynchronous work', async () => {
    const enqueue = createSerialTaskQueue();
    const order: string[] = [];
    let releaseFirst = () => undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = enqueue(async () => {
      order.push('first:start');
      await firstGate;
      order.push('first:end');
    });
    const second = enqueue(async () => {
      order.push('second:start');
      order.push('second:end');
    });

    await Promise.resolve();
    expect(order).toEqual(['first:start']);
    releaseFirst();
    await Promise.all([first, second]);
    expect(order).toEqual(['first:start', 'first:end', 'second:start', 'second:end']);
  });

  test('continues after a failed task', async () => {
    const enqueue = createSerialTaskQueue();
    const failed = enqueue(async () => {
      throw new Error('render failed');
    });
    const recovered = enqueue(async () => 'rendered');

    await expect(failed).rejects.toThrow('render failed');
    await expect(recovered).resolves.toBe('rendered');
  });
});
