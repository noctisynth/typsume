import sampleResume from '@typsume/core/fixtures/sample.json';
import { describe, expect, test } from 'vitest';
import { detectResumeFormat, parseResumeSource, serializeResume } from './resume-format';

describe('Web resume source formats', () => {
  test.each(['json', 'yaml', 'toml'] as const)(
    'round-trips %s through the shared schema',
    (format) => {
      const serialized = serializeResume(sampleResume, format);
      expect(parseResumeSource(serialized, format)).toEqual(
        parseResumeSource(JSON.stringify(sampleResume), 'json'),
      );
    },
  );

  test('detects supported extensions and rejects unknown files', () => {
    expect(detectResumeFormat('resume.yml')).toBe('yaml');
    expect(detectResumeFormat('resume.toml')).toBe('toml');
    expect(() => detectResumeFormat('resume.txt')).toThrow('Unsupported resume format');
  });

  test('reports parse errors without returning partial data', () => {
    expect(() => parseResumeSource('{', 'json')).toThrow('Unable to parse JSON');
    expect(() => parseResumeSource('schema = "wrong"', 'toml')).toThrow('schema validation');
  });
});
