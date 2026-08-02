import type { ResumeData, TemplateConfigOverrides } from '@typsume/core';
import { strToU8, zipSync } from 'fflate';
import { type ContactIconAsset, contactIconAssetBytes } from '@/models/contact-icon-model';
import { type PhotoAsset, photoAssetBytes } from '@/models/photo-model';
import { serializeProjectConfig } from './project-config';
import { serializeResume } from './resume-format';

export function createProjectBundle(
  resume: ResumeData,
  config: TemplateConfigOverrides,
  photoAsset: PhotoAsset | null,
  contactIconAssets: ContactIconAsset[] = [],
): Uint8Array {
  const files: Record<string, Uint8Array> = {
    'resume.toml': strToU8(serializeResume(resume, 'toml')),
    'typsume.config.toml': strToU8(serializeProjectConfig(config)),
  };

  const photoPath = resume.basics.photo;
  if (photoPath) {
    if (!photoAsset || photoAsset.path !== photoPath) {
      throw new Error('missing-photo-asset');
    }
    files[photoPath] = photoAssetBytes(photoAsset);
  }

  for (const contact of resume.basics.contacts) {
    if (!contact.icon.includes('/') && !/\.(?:png|svg)$/i.test(contact.icon)) continue;
    const asset = contactIconAssets.find((candidate) => candidate.path === contact.icon);
    if (!asset) throw new Error('missing-contact-icon-asset');
    files[contact.icon] = contactIconAssetBytes(asset);
  }

  return zipSync(files, { level: 6 });
}
