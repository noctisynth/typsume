import { ResumeSchema } from '@typsume/core';
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, test } from 'vitest';
import { createProjectBundle } from './project-bundle';

describe('resume project bundle', () => {
  test('contains resume data, CLI configuration, and the uploaded photo', () => {
    const resume = ResumeSchema.parse({
      schema: 'typst-resume/1.0',
      basics: { name: 'Xxx Yyy', photo: 'assets/profile.png' },
    });
    const bundle = unzipSync(
      createProjectBundle(
        resume,
        { 'theme-color': '#112233' },
        {
          path: 'assets/profile.png',
          fileName: 'profile.png',
          mimeType: 'image/png',
          base64: 'iVBORw==',
        },
      ),
    );

    expect(Object.keys(bundle).sort()).toEqual([
      'assets/profile.png',
      'resume.toml',
      'typsume.config.toml',
    ]);
    expect(strFromU8(bundle['resume.toml'] as Uint8Array)).toContain(
      'photo = "assets/profile.png"',
    );
    expect(strFromU8(bundle['typsume.config.toml'] as Uint8Array)).toContain(
      'theme-color = "#112233"',
    );
    expect(bundle['assets/profile.png']).toEqual(new Uint8Array([137, 80, 78, 71]));
  });

  test('rejects a project whose referenced photo bytes are unavailable', () => {
    const resume = ResumeSchema.parse({
      schema: 'typst-resume/1.0',
      basics: { name: 'Xxx Yyy', photo: 'assets/profile.png' },
    });
    expect(() => createProjectBundle(resume, {}, null)).toThrow('missing-photo-asset');
  });

  test('includes every referenced custom contact icon', () => {
    const resume = ResumeSchema.parse({
      schema: 'typst-resume/1.0',
      basics: {
        name: 'Xxx Yyy',
        contacts: [{ icon: 'assets/contact.svg', text: 'Example' }],
      },
    });
    const bundle = unzipSync(
      createProjectBundle(resume, {}, null, [
        {
          path: 'assets/contact.svg',
          fileName: 'contact.svg',
          mimeType: 'image/svg+xml',
          base64: 'PHN2Zz48L3N2Zz4=',
        },
      ]),
    );

    expect(strFromU8(bundle['assets/contact.svg'] as Uint8Array)).toBe('<svg></svg>');
  });
});
