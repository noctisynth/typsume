import { createTypstFontBuilder } from '@myriaddreamin/typst.ts/compiler';
import compilerWasmUrl from '@myriaddreamin/typst-ts-web-compiler/wasm?url';
import { createSerialTaskQueue } from './serial-task-queue';

interface RawFontInfo {
  info?: Array<{ family?: unknown }>;
}

const enqueue = createSerialTaskQueue();
const cache = new WeakMap<Uint8Array, Promise<string[]>>();
let builderPromise: ReturnType<typeof createBuilder> | null = null;

async function createBuilder() {
  const builder = createTypstFontBuilder();
  await builder.init({ getModule: () => compilerWasmUrl });
  return builder;
}

export function extractFontFamilies(value: RawFontInfo): string[] {
  const families = (value.info ?? [])
    .map((face) => face.family)
    .filter((family): family is string => typeof family === 'string' && family.trim().length > 0)
    .map((family) => family.trim());
  return [...new Set(families)];
}

export function inspectFontFamilies(bytes: Uint8Array): Promise<string[]> {
  const cached = cache.get(bytes);
  if (cached) return cached;

  const pending = enqueue(async () => {
    builderPromise ??= createBuilder();
    const builder = await builderPromise;
    const families = extractFontFamilies((await builder.getFontInfo(bytes)) as RawFontInfo);
    if (families.length === 0) throw new Error('Typst could not identify a font family.');
    return families;
  });
  cache.set(bytes, pending);
  return pending;
}

export async function selectFontFamily(
  fonts: Uint8Array[],
  preferredFamilies: string[] = [],
): Promise<string | null> {
  const inspected = await Promise.allSettled(fonts.map(inspectFontFamilies));
  const families = [
    ...new Set(inspected.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))),
  ];
  const normalized = new Map(families.map((family) => [family.trim().toLocaleLowerCase(), family]));
  for (const preferred of preferredFamilies) {
    const exact = normalized.get(preferred.trim().toLocaleLowerCase());
    if (exact) return exact;
  }
  return families[0] ?? null;
}
