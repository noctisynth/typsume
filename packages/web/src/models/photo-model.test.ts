import { describe, expect, test } from 'vitest';
import { mergePersistedPhoto, photoAssetBytes, photoAssetDataUrl } from './photo-model';

describe('photo asset model', () => {
  test('restores a valid persisted asset and decodes its bytes', () => {
    const asset = {
      path: 'assets/profile.png',
      fileName: 'profile.png',
      mimeType: 'image/png' as const,
      base64: 'iVBORw==',
    };
    const current = {
      asset: null,
      revision: 0,
      uploading: false,
      error: null,
      upload: async () => null,
      clear: () => undefined,
    };

    expect(mergePersistedPhoto({ asset }, current).asset).toEqual(asset);
    expect(mergePersistedPhoto({ asset }, current).revision).toBe(1);
    expect(photoAssetBytes(asset)).toEqual(new Uint8Array([137, 80, 78, 71]));
    expect(photoAssetDataUrl(asset)).toBe('data:image/png;base64,iVBORw==');
  });

  test('rejects persisted paths outside assets', () => {
    const current = {
      asset: null,
      revision: 0,
      uploading: false,
      error: null,
      upload: async () => null,
      clear: () => undefined,
    };
    expect(
      mergePersistedPhoto(
        {
          asset: {
            path: '../profile.png',
            fileName: 'profile.png',
            mimeType: 'image/png',
            base64: 'iVBORw==',
          },
        },
        current,
      ).asset,
    ).toBeNull();
  });
});
