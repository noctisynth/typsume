import 'fake-indexeddb/auto';
import { describe, expect, test } from 'vitest';
import { mergePersistedStyle, useStyleModel } from './style-model';

describe('style model', () => {
  test('stores template configuration outside resume data', () => {
    useStyleModel.getState().setOverride('theme-color', '#112233');
    expect(useStyleModel.getState().overrides['theme-color']).toBe('#112233');
  });

  test('rejects invalid persisted configuration', () => {
    const current = useStyleModel.getState();
    expect(mergePersistedStyle({ overrides: { unknown: true } }, current)).toBe(current);
  });
});
