import { type ResumeData, ResumeSchema } from '@typsume/core';
import sampleResume from '@typsume/core/fixtures/sample.json';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { indexedDbStorage } from '@/lib/indexed-db-storage';

export type ResumeSection =
  | 'basics'
  | 'skills'
  | 'education'
  | 'experience'
  | 'projects'
  | 'awards'
  | 'meta';

export const RESUME_SECTIONS: ResumeSection[] = [
  'basics',
  'skills',
  'education',
  'experience',
  'projects',
  'awards',
  'meta',
];

export const DEFAULT_RESUME = ResumeSchema.parse(sampleResume);

interface PersistedResumeState {
  resume: ResumeData;
  selectedSection: ResumeSection;
}

interface ResumeState extends PersistedResumeState {
  hydrated: boolean;
  revision: number;
  replaceResume: (value: unknown) => boolean;
  resetResume: () => void;
  selectSection: (section: ResumeSection) => void;
  markHydrated: () => void;
}

export function mergePersistedResume(persisted: unknown, current: ResumeState): ResumeState {
  if (!persisted || typeof persisted !== 'object') return current;
  const candidate = persisted as Partial<PersistedResumeState>;
  const parsed = ResumeSchema.safeParse(candidate.resume);
  const selectedSection = RESUME_SECTIONS.includes(candidate.selectedSection as ResumeSection)
    ? (candidate.selectedSection as ResumeSection)
    : current.selectedSection;

  return {
    ...current,
    resume: parsed.success ? parsed.data : current.resume,
    selectedSection,
  };
}

export const useResumeModel = create<ResumeState>()(
  persist(
    (set) => ({
      resume: DEFAULT_RESUME,
      selectedSection: 'basics',
      hydrated: false,
      revision: 0,
      replaceResume(value) {
        const parsed = ResumeSchema.safeParse(value);
        if (!parsed.success) return false;
        set((state) => ({ resume: parsed.data, revision: state.revision + 1 }));
        return true;
      },
      resetResume() {
        set((state) => ({ resume: DEFAULT_RESUME, revision: state.revision + 1 }));
      },
      selectSection(selectedSection) {
        set({ selectedSection });
      },
      markHydrated() {
        set({ hydrated: true });
      },
    }),
    {
      name: 'current-resume',
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: ({ resume, selectedSection }) => ({ resume, selectedSection }),
      merge: mergePersistedResume,
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    },
  ),
);
