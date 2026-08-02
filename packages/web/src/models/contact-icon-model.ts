import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { indexedDbStorage } from '@/lib/indexed-db-storage';

const ContactIconAssetSchema = z.object({
  path: z.string().startsWith('assets/'),
  fileName: z.string().min(1),
  mimeType: z.enum(['image/png', 'image/svg+xml']),
  base64: z.string().min(1),
});

export type ContactIconAsset = z.infer<typeof ContactIconAssetSchema>;

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

export function contactIconAssetBytes(asset: ContactIconAsset) {
  const binary = atob(asset.base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

type ContactIconState = {
  assets: Record<string, ContactIconAsset>;
  revision: number;
  upload: (file: File) => Promise<ContactIconAsset | null>;
};

export const useContactIconModel = create<ContactIconState>()(
  persist(
    (set) => ({
      assets: {},
      revision: 0,
      async upload(file) {
        if (file.type !== 'image/png' && file.type !== 'image/svg+xml') return null;
        const extension = file.type === 'image/svg+xml' ? 'svg' : 'png';
        const stem = file.name.replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9._-]+/g, '-');
        const fileName = `${stem.replace(/^-+|-+$/g, '') || 'contact-icon'}.${extension}`;
        const asset = ContactIconAssetSchema.parse({
          path: `assets/${fileName}`,
          fileName,
          mimeType: file.type,
          base64: bytesToBase64(new Uint8Array(await file.arrayBuffer())),
        });
        set((state) => ({
          assets: { ...state.assets, [asset.path]: asset },
          revision: state.revision + 1,
        }));
        return asset;
      },
    }),
    {
      name: 'contact-icons',
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: ({ assets }) => ({ assets }),
    },
  ),
);

export function getContactIconAssets(revision = useContactIconModel.getState().revision) {
  const state = useContactIconModel.getState();
  return revision === state.revision ? Object.values(state.assets) : [];
}
