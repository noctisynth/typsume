import { type TemplateConfigOverrides, TemplateConfigOverridesSchema } from '@typsume/core';
import { stringify as stringifyToml } from 'smol-toml';

export function serializeProjectConfig(config: TemplateConfigOverrides): string {
  return stringifyToml({
    template: 'default',
    output: 'resume.pdf',
    config: TemplateConfigOverridesSchema.parse(config),
  });
}
