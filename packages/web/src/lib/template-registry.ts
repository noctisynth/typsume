import {
  resolveTemplateConfig,
  type TemplateConfigOverrides,
  TemplateConfigOverridesSchema,
} from '@typsume/core';
import { z } from 'zod';
import metaValue from '../../../../templates/default/meta.toml?toml';
import templateSource from '../../../../templates/default/template.typ?raw';

const FontResourceSchema = z.object({
  urls: z.array(z.url()).min(1),
  integrity: z
    .string()
    .regex(/^sha256-[A-Za-z0-9+/]+={0,2}$/)
    .optional(),
});

const TemplateMetaSchema = z.object({
  name: z.string().min(1),
  'display-name': z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  resources: z.object({ fonts: z.array(FontResourceSchema).optional() }).optional(),
});

export type FontResource = z.infer<typeof FontResourceSchema>;

export interface TemplateConfig {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  sizes: Record<string, number>;
  layout: Record<string, string>;
}

export interface BrowserTemplate {
  name: string;
  displayName: string;
  source: string;
  assets: Record<string, string>;
  fontResources: FontResource[];
  configDefaults: TemplateConfigOverrides;
  config: (overrides?: TemplateConfigOverrides) => TemplateConfig;
}

const rawIcons = import.meta.glob('../../../../templates/default/icons/*.svg', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

const icons = Object.fromEntries(
  Object.entries(rawIcons).map(([path, source]) => [
    `icons/${path.slice(path.lastIndexOf('/') + 1)}`,
    source,
  ]),
);

const meta = TemplateMetaSchema.parse(metaValue);
const configDefaults = TemplateConfigOverridesSchema.parse(meta.config ?? {});

export const DEFAULT_TEMPLATE: BrowserTemplate = {
  name: meta.name,
  displayName: meta['display-name'] ?? meta.name,
  source: templateSource,
  assets: icons,
  fontResources: meta.resources?.fonts ?? [],
  configDefaults,
  config: (overrides) => resolveTemplateConfig(configDefaults, overrides),
};

export const TEMPLATE_REGISTRY = new Map([[DEFAULT_TEMPLATE.name, DEFAULT_TEMPLATE]]);
