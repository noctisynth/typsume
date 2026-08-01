import { describe, expect, test } from 'vitest';
import { findNewlyOpenedSection } from './accordion-state';

describe('resume form accordion state', () => {
  test('does not treat closing the default section as a navigation request', () => {
    expect(findNewlyOpenedSection(['basics'], [])).toBeUndefined();
  });

  test('selects a section only when the user opens it', () => {
    expect(findNewlyOpenedSection(['basics'], ['basics', 'skills'])).toBe('skills');
  });
});
