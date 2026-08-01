import { z } from 'zod';

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a six-digit hex color');
const length = z
  .string()
  .regex(/^\d+(?:\.\d+)?(?:pt|mm|cm|in|em)$/, 'Expected a positive Typst length');
const family = z.string().min(1);
const size = z.number().positive();

export const TemplateConfigSchema = z
  .object({
    'theme-color': color,
    'main-color': color,
    'secondary-color': color,
    'link-color': color,
    'icon-color': color,
    font: family,
    'mono-font': family,
    'font-size': size,
    'heading-size': size,
    'list-size': size,
    'item-title-size': size,
    'margin-top': length,
    'margin-bottom': length,
    'margin-left': length,
    'margin-right': length,
    'gutter-width': length,
    'side-width': length,
  })
  .strict();

export const TemplateConfigOverridesSchema = TemplateConfigSchema.partial().strict();

export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;
export type TemplateConfigOverrides = z.infer<typeof TemplateConfigOverridesSchema>;

export interface ResolvedTemplateConfig {
  colors: { theme: string; main: string; secondary: string; link: string; icon: string };
  fonts: { main: string; mono: string };
  sizes: { font: number; heading: number; list: number; item_title: number };
  layout: {
    margin_top: string;
    margin_bottom: string;
    margin_left: string;
    margin_right: string;
    gutter_width: string;
    side_width: string;
  };
}

export const FALLBACK_TEMPLATE_CONFIG: TemplateConfig = {
  'theme-color': '#0b628b',
  'main-color': '#343434',
  'secondary-color': '#808080',
  'link-color': '#1e6485',
  'icon-color': '#0b628b',
  font: 'Maple Mono NF',
  'mono-font': 'Maple Mono NF',
  'font-size': 10,
  'heading-size': 13,
  'list-size': 8.5,
  'item-title-size': 11,
  'margin-top': '1.5cm',
  'margin-bottom': '1.5cm',
  'margin-left': '1.5cm',
  'margin-right': '1.5cm',
  'gutter-width': '2em',
  'side-width': '12em',
};

export function resolveTemplateConfig(
  templateDefaults: unknown,
  projectOverrides: unknown = {},
): ResolvedTemplateConfig {
  const defaults = TemplateConfigOverridesSchema.parse(templateDefaults ?? {});
  const overrides = TemplateConfigOverridesSchema.parse(projectOverrides ?? {});
  const config = TemplateConfigSchema.parse({
    ...FALLBACK_TEMPLATE_CONFIG,
    ...defaults,
    ...overrides,
  });

  return {
    colors: {
      theme: config['theme-color'],
      main: config['main-color'],
      secondary: config['secondary-color'],
      link: config['link-color'],
      icon: config['icon-color'],
    },
    fonts: { main: config.font, mono: config['mono-font'] },
    sizes: {
      font: config['font-size'],
      heading: config['heading-size'],
      list: config['list-size'],
      item_title: config['item-title-size'],
    },
    layout: {
      margin_top: config['margin-top'],
      margin_bottom: config['margin-bottom'],
      margin_left: config['margin-left'],
      margin_right: config['margin-right'],
      gutter_width: config['gutter-width'],
      side_width: config['side-width'],
    },
  };
}
