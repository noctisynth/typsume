import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';
import { RESUME_JSON_SCHEMA_STRING, ResumeSchema, resumeJsonSchema } from '../src/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(here, 'fixtures');

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(resolve(fixturesDir, name), 'utf8'));
}

describe('ResumeSchema (Zod)', () => {
  it('accepts a complete sample', () => {
    const data = loadFixture('sample.json');
    const result = ResumeSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.experience[0]?.department).toBe('Developer Platform');
    }
  });

  it('accepts a minimal resume (only schema + basics.name)', () => {
    const data = loadFixture('minimal.json');
    const result = ResumeSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skills).toEqual([]);
      expect(result.data.education).toEqual([]);
      expect(result.data.experience).toEqual([]);
      expect(result.data.projects).toEqual([]);
      expect(result.data.awards).toEqual([]);
      expect(result.data.basics.contacts).toEqual([]);
    }
  });

  it('rejects invalid resume with multiple issues', () => {
    const data = loadFixture('invalid.json');
    const result = ResumeSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('schema');
      expect(paths).toContain('basics.contacts.0.link');
      expect(paths.some((p) => p.startsWith('skills.0.items.0.level'))).toBe(true);
    }
  });

  it('rejects empty name', () => {
    const result = ResumeSchema.safeParse({
      schema: 'typst-resume/1.0',
      basics: { name: '' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects skill level outside the enum', () => {
    const result = ResumeSchema.safeParse({
      schema: 'typst-resume/1.0',
      basics: { name: 'Xxx' },
      skills: [{ name: 'Languages', items: [{ name: 'TS', level: 'expert' }] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects malformed URL in item link', () => {
    const result = ResumeSchema.safeParse({
      schema: 'typst-resume/1.0',
      basics: { name: 'Xxx' },
      experience: [
        {
          title: 'Engineer',
          links: [{ label: 'site', href: 'not-a-url' }],
          highlights: [],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('exports a JSON Schema object with top-level type object', () => {
    expect(typeof RESUME_JSON_SCHEMA_STRING).toBe('string');
    expect(resumeJsonSchema).toBeTypeOf('object');
  });
});

describe('JSON Schema parity (Ajv)', () => {
  const ajv = new Ajv({ allErrors: true, strict: false, useDefaults: true });
  addFormats(ajv);
  const validate = ajv.compile(resumeJsonSchema);

  it('JSON Schema accepts the sample fixture', () => {
    const data = loadFixture('sample.json');
    const ok = validate(data);
    expect(ok).toBe(true);
  });

  it('JSON Schema accepts the minimal fixture', () => {
    const data = loadFixture('minimal.json');
    const ok = validate(data);
    expect(ok).toBe(true);
  });

  it('JSON Schema rejects the invalid fixture', () => {
    const data = loadFixture('invalid.json');
    const ok = validate(data);
    expect(ok).toBe(false);
    expect(validate.errors).not.toBeNull();
  });

  it('JSON Schema rejects empty name', () => {
    const ok = validate({
      schema: 'typst-resume/1.0',
      basics: { name: '' },
    });
    expect(ok).toBe(false);
  });
});
