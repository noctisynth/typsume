import 'fake-indexeddb/auto';
import { describe, expect, test } from 'vitest';
import { createIndexedDbStorage } from '@/lib/indexed-db-storage';
import { DEFAULT_RESUME, mergePersistedResume, useResumeModel } from './resume-model';

describe('resume model', () => {
  test('rejects invalid edits without replacing the current resume', () => {
    const before = useResumeModel.getState().resume;
    expect(useResumeModel.getState().replaceResume({ schema: 'invalid' })).toBe(false);
    expect(useResumeModel.getState().resume).toEqual(before);
  });

  test('ignores invalid persisted resume data and sections', () => {
    const current = useResumeModel.getState();
    const merged = mergePersistedResume(
      { resume: { schema: 'invalid' }, selectedSection: 'unknown' },
      current,
    );
    expect(merged.resume).toEqual(current.resume);
    expect(merged.selectedSection).toBe(current.selectedSection);
  });

  test('stores the draft in IndexedDB without using localStorage', async () => {
    const { storage, flush } = createIndexedDbStorage(60_000);
    const write = storage.setItem('test-draft', JSON.stringify(DEFAULT_RESUME));
    await flush('test-draft');
    await write;
    expect(await storage.getItem('test-draft')).toBe(JSON.stringify(DEFAULT_RESUME));
  });

  test('records every outline navigation even when the selected section is unchanged', () => {
    const before = useResumeModel.getState().sectionNavigationRevision;
    const section = useResumeModel.getState().selectedSection;
    useResumeModel.getState().navigateSection(section);
    useResumeModel.getState().navigateSection(section);
    expect(useResumeModel.getState().sectionNavigationRevision).toBe(before + 2);
  });

  test('imports a validated resume atomically', () => {
    const before = useResumeModel.getState().importRevision;
    expect(useResumeModel.getState().importResume({ schema: 'invalid' })).toBe(false);
    expect(useResumeModel.getState().importRevision).toBe(before);
    expect(useResumeModel.getState().importResume(DEFAULT_RESUME)).toBe(true);
    expect(useResumeModel.getState().importRevision).toBe(before + 1);
  });
});
