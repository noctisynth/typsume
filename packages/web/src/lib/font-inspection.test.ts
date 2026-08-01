import { describe, expect, test } from 'vitest';
import { extractFontFamilies } from './font-inspection';

describe('font inspection results', () => {
  test('uses unique internal font families instead of browser display names', () => {
    expect(
      extractFontFamilies({
        info: [
          { family: 'Maple Mono NF CN' },
          { family: 'Maple Mono NF CN' },
          { family: 'Maple Mono NF CN Bold' },
          { family: '' },
        ],
      }),
    ).toEqual(['Maple Mono NF CN', 'Maple Mono NF CN Bold']);
  });
});
