import {
  FALLBACK_TEMPLATE_CONFIG,
  type TemplateConfigOverrides,
  TemplateConfigOverridesSchema,
} from '@typsume/core';
import { useEffect, useState } from 'react';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { DEFAULT_TEMPLATE } from '@/lib/template-registry';
import { useStyleModel } from '@/models/style-model';

interface StyleConfigFieldProps {
  configKey: keyof TemplateConfigOverrides;
  label: string;
  type?: 'color' | 'number' | 'text';
  step?: string;
}

export function StyleConfigField({ configKey, label, type = 'text', step }: StyleConfigFieldProps) {
  const overrides = useStyleModel((state) => state.overrides);
  const setOverride = useStyleModel((state) => state.setOverride);
  const resolvedValue =
    overrides[configKey] ??
    DEFAULT_TEMPLATE.configDefaults[configKey] ??
    FALLBACK_TEMPLATE_CONFIG[configKey];
  const [value, setValue] = useState(String(resolvedValue));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setValue(String(resolvedValue)), [resolvedValue]);

  function commit(nextValue: string) {
    const normalized =
      nextValue.trim() === '' ? undefined : type === 'number' ? Number(nextValue) : nextValue;
    const candidate = { ...overrides };
    if (normalized === undefined) delete candidate[configKey];
    else Object.assign(candidate, { [configKey]: normalized });
    const parsed = TemplateConfigOverridesSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid configuration value');
      return;
    }
    setError(null);
    setOverride(configKey, normalized);
  }

  const id = `style-${configKey}`;
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        step={step}
        type={type}
        value={value}
        onBlur={(event) => commit(event.target.value)}
        onChange={(event) => {
          setValue(event.target.value);
          if (type === 'color') commit(event.target.value);
        }}
      />
      <FieldError>{error}</FieldError>
    </Field>
  );
}
