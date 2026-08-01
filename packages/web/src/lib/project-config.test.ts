import { parse as parseToml } from 'smol-toml';
import { describe, expect, test } from 'vitest';
import { serializeProjectConfig } from './project-config';

describe('CLI project configuration export', () => {
  test('serializes a complete typsume.config.toml shape', () => {
    const source = serializeProjectConfig({
      'theme-color': '#112233',
      'font-size': 9.5,
      'margin-top': '1.5cm',
    });

    expect(parseToml(source)).toEqual({
      template: 'default',
      output: 'resume.pdf',
      config: {
        'theme-color': '#112233',
        'font-size': 9.5,
        'margin-top': '1.5cm',
      },
    });
  });
});
