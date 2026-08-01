export function createSerialTaskQueue() {
  let tail = Promise.resolve();

  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const pending = tail.then(task);
    tail = pending.then(
      () => undefined,
      () => undefined,
    );
    return pending;
  };
}
