import type { ResumeInput } from '@typsume/core';
import type { UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FontSelector } from '@/components/font-manager/font-selector';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MetaFieldsProps {
  register: UseFormRegister<ResumeInput>;
  locale: string | undefined;
  setLocale: (locale: string) => void;
}

export function MetaFields({ register, locale, setLocale }: MetaFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <Field>
        <FieldLabel>{t('field.locale')}</FieldLabel>
        <Select value={locale ?? 'zh-CN'} onValueChange={setLocale}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="zh-CN">简体中文</SelectItem>
            <SelectItem value="en-US">English</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="meta-font-size">{t('field.fontSize')}</FieldLabel>
        <Input
          id="meta-font-size"
          max="18"
          min="6"
          step="0.5"
          type="number"
          {...register('meta.fontSize', {
            setValueAs: (value) => (value === '' ? undefined : Number(value)),
          })}
        />
      </Field>
      <FontSelector />
      <input type="hidden" value="default" {...register('meta.template')} />
    </div>
  );
}
