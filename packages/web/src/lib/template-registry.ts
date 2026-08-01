import type { ResumeData } from '@typsume/core';
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
  config: (resume: ResumeData) => TemplateConfig;
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
const cfg = meta.config ?? {};

export const DEFAULT_TEMPLATE: BrowserTemplate = {
  name: meta.name,
  displayName: meta['display-name'] ?? meta.name,
  source: templateSource,
  assets: icons,
  fontResources: meta.resources?.fonts ?? [],
  config: (resume) => ({
    colors: {
      theme: (cfg['theme-color'] as string) ?? '#0b628b',
      main: (cfg['main-color'] as string) ?? '#343434',
      secondary: (cfg['secondary-color'] as string) ?? '#808080',
      link: (cfg['link-color'] as string) ?? '#1e6485',
      icon: (cfg['icon-color'] as string) ?? '#0b628b',
    },
    fonts: {
      main: (cfg.font as string) ?? 'Maple Mono NF',
      mono: (cfg['mono-font'] as string) ?? 'Maple Mono NF',
    },
    sizes: {
      font: resume.meta?.fontSize ?? (cfg['font-size'] as number) ?? 10,
      heading: (cfg['heading-size'] as number) ?? 13,
      list: (cfg['list-size'] as number) ?? 8.5,
      item_title: (cfg['item-title-size'] as number) ?? 11,
    },
    layout: {
      margin_top: (cfg['margin-top'] as string) ?? '1.5cm',
      margin_bottom: (cfg['margin-bottom'] as string) ?? '1.5cm',
      margin_left: (cfg['margin-left'] as string) ?? '1.5cm',
      margin_right: (cfg['margin-right'] as string) ?? '1.5cm',
      gutter_width: (cfg['gutter-width'] as string) ?? '2em',
      side_width: (cfg['side-width'] as string) ?? '12em',
    },
  }),
};

export const TEMPLATE_REGISTRY = new Map([[DEFAULT_TEMPLATE.name, DEFAULT_TEMPLATE]]);
