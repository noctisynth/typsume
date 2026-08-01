import { describe, expect, test } from 'vitest';
import { calculateContainedScrollTop } from './outline-scroll';

describe('outline navigation', () => {
  test('calculates a scroll position relative to the form viewport', () => {
    expect(calculateContainedScrollTop(320, 64, 224)).toBe(480);
  });
});
