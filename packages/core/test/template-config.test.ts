import { describe, expect, test } from 'vitest';
import {
  FALLBACK_TEMPLATE_CONFIG,
  resolveTemplateConfig,
  TemplateConfigOverridesSchema,
} from '../src/template-config.ts';

describe('template configuration', () => {
  test('applies project overrides after template defaults', () => {
    const resolved = resolveTemplateConfig(
      { 'theme-color': '#112233', 'font-size': 9 },
      { 'theme-color': '#abcdef', 'heading-size': 15, 'contact-size': 8 },
    );
    expect(resolved.colors.theme).toBe('#abcdef');
    expect(resolved.sizes.font).toBe(9);
    expect(resolved.sizes.heading).toBe(15);
    expect(resolved.sizes.contact).toBe(8);
  });

  test('provides the complete compiler configuration when overrides are empty', () => {
    const resolved = resolveTemplateConfig(FALLBACK_TEMPLATE_CONFIG);
    expect(resolved.fonts.main).toBe('Maple Mono NF');
    expect(resolved.layout.side_width).toBe('12em');
  });

  test('rejects unknown keys and unsafe values', () => {
    expect(TemplateConfigOverridesSchema.safeParse({ unknown: true }).success).toBe(false);
    expect(TemplateConfigOverridesSchema.safeParse({ 'theme-color': 'red' }).success).toBe(false);
    expect(TemplateConfigOverridesSchema.safeParse({ 'margin-top': 'calc(1cm)' }).success).toBe(
      false,
    );
  });
});
