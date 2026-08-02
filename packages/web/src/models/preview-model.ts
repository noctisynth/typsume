import type { ResumeData } from '@typsume/core';
import { create } from 'zustand';
import type { CompilePhase } from '@/lib/browser-compiler';
import type { FontStatus } from '@/lib/font-resources';
import { getSelectedFontBundle } from '@/models/font-model';
import { getPhotoAsset } from '@/models/photo-model';
import { getStyleOverrides } from '@/models/style-model';

export type FontPermission = 'unknown' | 'allowed' | 'denied';
export type PreviewStateKind = 'idle' | 'loading' | 'ready' | 'error' | 'exporting';

interface PreviewState {
  fontPermission: FontPermission;
  state: PreviewStateKind;
  phase: CompilePhase | null;
  artifact: Uint8Array | null;
  warnings: string[];
  error: string | null;
  latencyMs: number | null;
  setFontPermission: (permission: Exclude<FontPermission, 'unknown'>) => void;
  compile: (
    resume: ResumeData,
    fontRevision?: number,
    styleRevision?: number,
    photoRevision?: number,
  ) => Promise<void>;
  exportPdf: (resume: ResumeData) => Promise<Uint8Array>;
}

let compileSequence = 0;

function appendStatus(status: FontStatus): void {
  if (status.kind !== 'warning') return;
  usePreviewModel.setState((current) => ({
    warnings: current.warnings.includes(status.message)
      ? current.warnings
      : [...current.warnings, status.message],
  }));
}

function setPhase(phase: CompilePhase): void {
  usePreviewModel.setState({ phase });
}

export const usePreviewModel = create<PreviewState>((set, get) => ({
  fontPermission: 'unknown',
  state: 'idle',
  phase: null,
  artifact: null,
  warnings: [],
  error: null,
  latencyMs: null,
  setFontPermission(fontPermission) {
    set({ fontPermission, state: 'idle', warnings: [], error: null });
  },
  async compile(resume, fontRevision, styleRevision, photoRevision) {
    const permission = get().fontPermission;
    if (permission === 'unknown') return;
    const sequence = ++compileSequence;
    const startedAt = performance.now();
    set({ state: 'loading', phase: 'loading-template', warnings: [], error: null });
    try {
      const { compilePreview } = await import('@/lib/browser-compiler');
      const artifact = await compilePreview(
        resume,
        permission === 'allowed',
        getSelectedFontBundle(fontRevision),
        getPhotoAsset(photoRevision),
        getStyleOverrides(styleRevision),
        {
          phase: setPhase,
          resource: appendStatus,
        },
      );
      if (sequence !== compileSequence) return;
      set({
        artifact,
        state: 'ready',
        phase: null,
        latencyMs: Math.round(performance.now() - startedAt),
      });
    } catch (error) {
      if (sequence !== compileSequence) return;
      set({
        state: 'error',
        phase: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
  async exportPdf(resume) {
    const permission = get().fontPermission;
    if (permission === 'unknown') throw new Error('Font download permission is required first.');
    set({ state: 'exporting', phase: 'compiling-pdf', error: null });
    try {
      const { compilePdf } = await import('@/lib/browser-compiler');
      const pdf = await compilePdf(
        resume,
        permission === 'allowed',
        getSelectedFontBundle(),
        getPhotoAsset(),
        getStyleOverrides(),
        {
          phase: setPhase,
          resource: appendStatus,
        },
      );
      set({ state: 'ready', phase: null });
      return pdf;
    } catch (error) {
      set({
        state: 'error',
        phase: null,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
}));
