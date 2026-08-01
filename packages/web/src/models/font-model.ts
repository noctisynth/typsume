import { create } from 'zustand';
import { inspectFontFamilies } from '@/lib/font-inspection';

export interface UploadedFontFile {
  id: string;
  fileName: string;
  bytes: Uint8Array;
  families: string[];
}

export interface SelectedFontBundle {
  key: string;
  family: string;
  fonts: Uint8Array[];
}

interface FontState {
  files: UploadedFontFile[];
  selectedFamily: string | null;
  revision: number;
  uploading: boolean;
  error: string | null;
  uploadFiles: (files: File[]) => Promise<void>;
  selectFamily: (family: string | null) => void;
  clearUploads: () => void;
}

let fileSequence = 0;

export const useFontModel = create<FontState>((set, get) => ({
  files: [],
  selectedFamily: null,
  revision: 0,
  uploading: false,
  error: null,
  async uploadFiles(files) {
    if (files.length === 0) return;
    set({ uploading: true, error: null });
    const accepted: UploadedFontFile[] = [];
    const errors: string[] = [];
    for (const file of files) {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const families = await inspectFontFamilies(bytes);
        accepted.push({
          id: `font-${++fileSequence}`,
          fileName: file.name,
          bytes,
          families,
        });
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const current = get();
    const selectedFamily = current.selectedFamily ?? accepted[0]?.families[0] ?? null;
    set({
      files: [...current.files, ...accepted],
      selectedFamily,
      revision: current.revision + (accepted.length > 0 ? 1 : 0),
      uploading: false,
      error: errors.length > 0 ? errors.join('\n') : null,
    });
  },
  selectFamily(selectedFamily) {
    set((state) => ({ selectedFamily, revision: state.revision + 1 }));
  },
  clearUploads() {
    set((state) => ({
      files: [],
      selectedFamily: null,
      revision: state.revision + 1,
      error: null,
    }));
  },
}));

export function getSelectedFontBundle(
  revision = useFontModel.getState().revision,
): SelectedFontBundle | null {
  const state = useFontModel.getState();
  if (revision !== state.revision) return null;
  const selectedFamily = state.selectedFamily;
  if (!selectedFamily) return null;
  const matchingFiles = state.files.filter((file) => file.families.includes(selectedFamily));
  if (matchingFiles.length === 0) return null;
  return {
    key: `${selectedFamily}:${matchingFiles.map((file) => file.id).join(',')}`,
    family: selectedFamily,
    fonts: matchingFiles.map((file) => file.bytes),
  };
}
