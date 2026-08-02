import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { indexedDbStorage } from '@/lib/indexed-db-storage';

const PHOTO_MIME_TYPES = ['image/png', 'image/jpeg'] as const;

const PhotoAssetSchema = z.object({
  path: z.string().startsWith('assets/'),
  fileName: z.string().min(1),
  mimeType: z.enum(PHOTO_MIME_TYPES),
  base64: z.string().min(1),
});

export type PhotoAsset = z.infer<typeof PhotoAssetSchema>;

interface PersistedPhotoState {
  asset: PhotoAsset | null;
}

interface PhotoState extends PersistedPhotoState {
  revision: number;
  uploading: boolean;
  error: 'unsupported-type' | 'read-failed' | null;
  upload: (file: File) => Promise<PhotoAsset | null>;
  clear: () => void;
}

function safePhotoFileName(file: File): string {
  const extension = file.type === 'image/png' ? 'png' : 'jpg';
  const stem = file.name.replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9._-]+/g, '-');
  return `${stem.replace(/^-+|-+$/g, '') || 'profile'}.${extension}`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

export function photoAssetBytes(asset: PhotoAsset): Uint8Array {
  const binary = atob(asset.base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function photoAssetDataUrl(asset: PhotoAsset): string {
  return `data:${asset.mimeType};base64,${asset.base64}`;
}

export function mergePersistedPhoto(persisted: unknown, current: PhotoState): PhotoState {
  if (!persisted || typeof persisted !== 'object') return current;
  const candidate = persisted as Partial<PersistedPhotoState>;
  if (candidate.asset === null) return { ...current, asset: null };
  const parsed = PhotoAssetSchema.safeParse(candidate.asset);
  return parsed.success
    ? { ...current, asset: parsed.data, revision: current.revision + 1 }
    : current;
}

export const usePhotoModel = create<PhotoState>()(
  persist(
    (set) => ({
      asset: null,
      revision: 0,
      uploading: false,
      error: null,
      async upload(file) {
        if (!PHOTO_MIME_TYPES.includes(file.type as (typeof PHOTO_MIME_TYPES)[number])) {
          set({ error: 'unsupported-type' });
          return null;
        }
        set({ uploading: true, error: null });
        try {
          const fileName = safePhotoFileName(file);
          const asset = PhotoAssetSchema.parse({
            path: `assets/${fileName}`,
            fileName,
            mimeType: file.type,
            base64: bytesToBase64(new Uint8Array(await file.arrayBuffer())),
          });
          set((state) => ({
            asset,
            revision: state.revision + 1,
            uploading: false,
            error: null,
          }));
          return asset;
        } catch {
          set({
            uploading: false,
            error: 'read-failed',
          });
          return null;
        }
      },
      clear() {
        set((state) => ({
          asset: null,
          revision: state.revision + 1,
          uploading: false,
          error: null,
        }));
      },
    }),
    {
      name: 'profile-photo',
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: ({ asset }) => ({ asset }),
      merge: mergePersistedPhoto,
    },
  ),
);

export function getPhotoAsset(revision = usePhotoModel.getState().revision): PhotoAsset | null {
  const state = usePhotoModel.getState();
  return revision === state.revision ? state.asset : null;
}
