import { createTypstRenderer, type TypstRenderer } from '@myriaddreamin/typst.ts';
import rendererWasmUrl from '@myriaddreamin/typst-ts-renderer/wasm?url';
import { createSerialTaskQueue } from './serial-task-queue';

let rendererPromise: Promise<TypstRenderer> | null = null;
const enqueue = createSerialTaskQueue();

function getRenderer(): Promise<TypstRenderer> {
  if (!rendererPromise) {
    rendererPromise = (async () => {
      const renderer = createTypstRenderer();
      await renderer.init({
        beforeBuild: [],
        getModule: () => rendererWasmUrl,
      });
      return renderer;
    })().catch((error) => {
      rendererPromise = null;
      throw error;
    });
  }
  return rendererPromise;
}

export function enqueueRendererTask<T>(task: (renderer: TypstRenderer) => Promise<T>): Promise<T> {
  return enqueue(async () => {
    const renderer = await getRenderer();
    try {
      return await task(renderer);
    } catch (error) {
      rendererPromise = null;
      throw error;
    }
  });
}

export function renderArtifact(artifact: Uint8Array): Promise<string> {
  const artifactCopy = artifact.slice();
  return enqueueRendererTask((renderer) =>
    renderer.renderSvg({
      artifactContent: artifactCopy,
      format: 'vector',
    }),
  );
}
