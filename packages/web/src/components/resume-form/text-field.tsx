import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface BaseFieldProps {
  id: string;
  label: string;
  optional?: string;
  description?: string;
  registration: UseFormRegisterReturn;
}

type TextFieldProps = BaseFieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'name'>;

export function TextField({
  id,
  label,
  optional,
  description,
  registration,
  ...props
}: TextFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label}
        {optional ? <span className="font-normal text-muted-foreground">{optional}</span> : null}
      </FieldLabel>
      <Input id={id} {...registration} {...props} />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

type TextareaFieldProps = BaseFieldProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'name'>;

export function TextareaField({
  id,
  label,
  optional,
  description,
  registration,
  ...props
}: TextareaFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label}
        {optional ? <span className="font-normal text-muted-foreground">{optional}</span> : null}
      </FieldLabel>
      <Textarea id={id} {...registration} {...props} />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}
