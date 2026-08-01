import type { ResumeInput, ResumeOutput } from '@typsume/core';
import { type Control, Controller, type Path } from 'react-hook-form';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

interface ControlledListFieldProps {
  control: Control<ResumeInput, unknown, ResumeOutput>;
  name: Path<ResumeInput>;
  id: string;
  label: string;
  description: string;
}

export function ControlledListField({
  control,
  name,
  id,
  label,
  description,
}: ControlledListFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const lines = Array.isArray(field.value)
          ? field.value.filter((value): value is string => typeof value === 'string')
          : [];
        return (
          <Field>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Textarea
              id={id}
              rows={3}
              value={lines.join('\n')}
              onBlur={field.onBlur}
              onChange={(event) =>
                field.onChange(
                  event.target.value
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean),
                )
              }
            />
            <FieldDescription>{description}</FieldDescription>
          </Field>
        );
      }}
    />
  );
}

export function ControlledLinksField({
  control,
  name,
  id,
  label,
  description,
}: ControlledListFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const links = Array.isArray(field.value)
          ? field.value.filter(
              (value): value is { label: string; href: string } =>
                typeof value === 'object' && value !== null && 'label' in value && 'href' in value,
            )
          : [];
        return (
          <Field>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Textarea
              id={id}
              rows={2}
              value={links.map((link) => `${link.label} | ${link.href}`).join('\n')}
              onBlur={field.onBlur}
              onChange={(event) =>
                field.onChange(
                  event.target.value
                    .split('\n')
                    .map((line) => {
                      const [linkLabel, ...href] = line.split('|');
                      return { label: linkLabel?.trim() ?? '', href: href.join('|').trim() };
                    })
                    .filter((link) => link.label || link.href),
                )
              }
            />
            <FieldDescription>{description}</FieldDescription>
          </Field>
        );
      }}
    />
  );
}
