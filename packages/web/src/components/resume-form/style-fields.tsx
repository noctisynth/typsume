import type { TemplateConfigOverrides } from '@typsume/core';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useStyleModel } from '@/models/style-model';
import { StyleConfigField } from './style-config-field';

const groups: Array<{
  title: string;
  fields: Array<{ key: keyof TemplateConfigOverrides; type?: 'color' | 'number'; step?: string }>;
}> = [
  {
    title: 'colors',
    fields: [
      { key: 'theme-color', type: 'color' },
      { key: 'main-color', type: 'color' },
      { key: 'secondary-color', type: 'color' },
      { key: 'link-color', type: 'color' },
      { key: 'icon-color', type: 'color' },
    ],
  },
  { title: 'fonts', fields: [{ key: 'font' }, { key: 'mono-font' }] },
  {
    title: 'sizes',
    fields: [
      { key: 'font-size', type: 'number', step: '0.5' },
      { key: 'heading-size', type: 'number', step: '0.5' },
      { key: 'list-size', type: 'number', step: '0.5' },
      { key: 'item-title-size', type: 'number', step: '0.5' },
    ],
  },
  {
    title: 'layout',
    fields: [
      { key: 'margin-top' },
      { key: 'margin-bottom' },
      { key: 'margin-left' },
      { key: 'margin-right' },
      { key: 'gutter-width' },
      { key: 'side-width' },
    ],
  },
];

export function StyleFields() {
  const { t } = useTranslation();
  const resetOverrides = useStyleModel((state) => state.resetOverrides);
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section className="space-y-3" key={group.title}>
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {t(`style.group.${group.title}`)}
            </p>
            <Separator className="flex-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {group.fields.map((field) => (
              <StyleConfigField
                configKey={field.key}
                key={field.key}
                label={t(`style.field.${field.key}`)}
                {...(field.step ? { step: field.step } : {})}
                {...(field.type ? { type: field.type } : {})}
              />
            ))}
          </div>
        </section>
      ))}
      <Button className="w-full" type="button" variant="outline" onClick={resetOverrides}>
        <RotateCcw data-icon="inline-start" />
        {t('style.reset')}
      </Button>
    </div>
  );
}
