import { beforeEach, describe, expect, test, vi } from 'vitest';

const rendererMock = vi.hoisted(() => ({
  created: 0,
  active: 0,
  maxActive: 0,
  failNext: true,
  inputs: [] as Uint8Array[],
}));

vi.mock('@myriaddreamin/typst-ts-renderer/wasm?url', () => ({ default: 'renderer.wasm' }));
vi.mock('@myriaddreamin/typst.ts', () => ({
  createTypstRenderer: () => {
    rendererMock.created += 1;
    return {
      init: vi.fn(),
      renderSvg: async ({ artifactContent }: { artifactContent: Uint8Array }) => {
        rendererMock.inputs.push(artifactContent);
        if (rendererMock.failNext) {
          rendererMock.failNext = false;
          throw new Error('renderer panic');
        }
        rendererMock.active += 1;
        rendererMock.maxActive = Math.max(rendererMock.maxActive, rendererMock.active);
        await Promise.resolve();
        rendererMock.active -= 1;
        return '<svg />';
      },
    };
  },
}));

describe('renderer runtime', () => {
  beforeEach(() => {
    rendererMock.created = 0;
    rendererMock.active = 0;
    rendererMock.maxActive = 0;
    rendererMock.failNext = true;
    rendererMock.inputs = [];
  });

  test('recreates a failed renderer and serializes renders with artifact copies', async () => {
    const { renderArtifact } = await import('./renderer-runtime');
    const artifact = new Uint8Array([1, 2, 3]);

    await expect(renderArtifact(artifact)).rejects.toThrow('renderer panic');
    await expect(
      Promise.all([renderArtifact(artifact), renderArtifact(artifact)]),
    ).resolves.toEqual(['<svg />', '<svg />']);

    expect(rendererMock.created).toBe(2);
    expect(rendererMock.maxActive).toBe(1);
    expect(rendererMock.inputs).toHaveLength(3);
    for (const input of rendererMock.inputs) expect(input).not.toBe(artifact);
  });
});
