import type { ResumeInput } from '@typsume/core';
import type { UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FontSelector } from '@/components/font-manager/font-selector';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StyleFields } from './style-fields';

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
      <FontSelector />
      <StyleFields />
      <input type="hidden" value="default" {...register('meta.template')} />
    </div>
  );
}
