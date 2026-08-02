import type { ResumeData, TemplateConfigOverrides } from '@typsume/core';
import { strToU8, zipSync } from 'fflate';
import { type PhotoAsset, photoAssetBytes } from '@/models/photo-model';
import { serializeProjectConfig } from './project-config';
import { serializeResume } from './resume-format';

export function createProjectBundle(
  resume: ResumeData,
  config: TemplateConfigOverrides,
  photoAsset: PhotoAsset | null,
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

  return zipSync(files, { level: 6 });
}
