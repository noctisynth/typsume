import { type TemplateConfigOverrides, TemplateConfigOverridesSchema } from '@typsume/core';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { indexedDbStorage } from '@/lib/indexed-db-storage';

interface PersistedStyleState {
  overrides: TemplateConfigOverrides;
}

interface StyleState extends PersistedStyleState {
  revision: number;
  setOverride: (key: keyof TemplateConfigOverrides, value: string | number | undefined) => void;
  resetOverrides: () => void;
}

export function mergePersistedStyle(persisted: unknown, current: StyleState): StyleState {
  if (!persisted || typeof persisted !== 'object') return current;
  const candidate = persisted as Partial<PersistedStyleState>;
  const parsed = TemplateConfigOverridesSchema.safeParse(candidate.overrides);
  return parsed.success ? { ...current, overrides: parsed.data } : current;
}

export const useStyleModel = create<StyleState>()(
  persist(
    (set) => ({
      overrides: {},
      revision: 0,
      setOverride(key, value) {
        set((state) => {
          const overrides = { ...state.overrides };
          if (value === undefined) delete overrides[key];
          else Object.assign(overrides, { [key]: value });
          const parsed = TemplateConfigOverridesSchema.parse(overrides);
          return { overrides: parsed, revision: state.revision + 1 };
        });
      },
      resetOverrides() {
        set((state) => ({ overrides: {}, revision: state.revision + 1 }));
      },
    }),
    {
      name: 'template-style',
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: ({ overrides }) => ({ overrides }),
      merge: mergePersistedStyle,
    },
  ),
);

export function getStyleOverrides(
  revision = useStyleModel.getState().revision,
): TemplateConfigOverrides {
  const state = useStyleModel.getState();
  return revision === state.revision ? state.overrides : {};
}
