import type { StateStorage } from 'zustand/middleware';

const DATABASE_NAME = 'typsume-web';
const STORE_NAME = 'drafts';
const DATABASE_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB.'));
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function readValue(name: string): Promise<string | null> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database
        .transaction(STORE_NAME, 'readonly')
        .objectStore(STORE_NAME)
        .get(name);
      request.onerror = () => reject(request.error ?? new Error('Unable to read the local draft.'));
      request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null);
    });
  } finally {
    database.close();
  }
}

async function writeValue(name: string, value: string | null): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.onerror = () =>
        reject(transaction.error ?? new Error('Unable to save the draft.'));
      transaction.oncomplete = () => resolve();
      const store = transaction.objectStore(STORE_NAME);
      if (value === null) store.delete(name);
      else store.put(value, name);
    });
  } finally {
    database.close();
  }
}

interface PendingWrite {
  value: string | null;
  resolves: Array<() => void>;
  rejects: Array<(error: unknown) => void>;
  timer: ReturnType<typeof setTimeout>;
}

export function createIndexedDbStorage(writeDelayMs = 1_000) {
  const pendingWrites = new Map<string, PendingWrite>();

  async function flush(name: string): Promise<void> {
    const pending = pendingWrites.get(name);
    if (!pending) return;
    pendingWrites.delete(name);
    try {
      await writeValue(name, pending.value);
      for (const resolve of pending.resolves) resolve();
    } catch (error) {
      for (const reject of pending.rejects) reject(error);
    }
  }

  function schedule(name: string, value: string | null): Promise<void> {
    return new Promise((resolve, reject) => {
      const pending = pendingWrites.get(name);
      if (pending) {
        clearTimeout(pending.timer);
        pending.value = value;
        pending.resolves.push(resolve);
        pending.rejects.push(reject);
        pending.timer = setTimeout(() => void flush(name), writeDelayMs);
        return;
      }

      pendingWrites.set(name, {
        value,
        resolves: [resolve],
        rejects: [reject],
        timer: setTimeout(() => void flush(name), writeDelayMs),
      });
    });
  }

  const storage: StateStorage = {
    getItem: readValue,
    setItem: (name, value) => schedule(name, value),
    removeItem: (name) => schedule(name, null),
  };

  return { storage, flush };
}

export const indexedDbStorage = createIndexedDbStorage().storage;
