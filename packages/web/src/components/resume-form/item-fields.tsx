import type { ResumeInput, ResumeOutput } from '@typsume/core';
import { Plus, Trash2 } from 'lucide-react';
import { type Control, type UseFormRegister, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ControlledLinksField, ControlledListField } from './controlled-list-field';
import { TextareaField, TextField } from './text-field';

export type ItemSection = 'education' | 'experience' | 'projects';

interface ItemFieldsProps {
  section: ItemSection;
  control: Control<ResumeInput, unknown, ResumeOutput>;
  register: UseFormRegister<ResumeInput>;
}

export function ItemFields({ section, control, register }: ItemFieldsProps) {
  const { t } = useTranslation();
  const items = useFieldArray({ control, name: section });
  const isProject = section === 'projects';

  return (
    <div className="space-y-3">
      {items.fields.map((item, index) => (
        <Card className="bg-muted/30 shadow-none" key={item.id}>
          <CardHeader className="flex-row items-center justify-between px-4 py-3">
            <span className="font-mono text-xs text-muted-foreground">
              {String(index + 1).padStart(2, '0')}
            </span>
            <Button size="icon-sm" variant="ghost" onClick={() => items.remove(index)}>
              <Trash2 />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <TextField
                id={`${section}-title-${item.id}`}
                label={isProject ? t('field.projectName') : t('field.organization')}
                registration={register(`${section}.${index}.title`)}
              />
              <TextField
                id={`${section}-subtitle-${item.id}`}
                label={isProject ? t('field.projectSource') : t('field.role')}
                optional={t('common.optional')}
                registration={register(`${section}.${index}.subtitle`)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                id={`${section}-period-${item.id}`}
                label={t('field.period')}
                optional={t('common.optional')}
                registration={register(`${section}.${index}.period`)}
              />
              {section === 'experience' ? (
                <TextField
                  id={`${section}-department-${item.id}`}
                  label={t('field.department')}
                  optional={t('common.optional')}
                  registration={register(`${section}.${index}.department`)}
                />
              ) : null}
            </div>
            {isProject ? (
              <ControlledListField
                control={control}
                description={t('hint.onePerLine')}
                id={`${section}-stack-${item.id}`}
                label={t('field.stack')}
                name={`${section}.${index}.stack`}
              />
            ) : null}
            <TextareaField
              id={`${section}-body-${item.id}`}
              label={t('field.body')}
              optional={t('common.optional')}
              registration={register(`${section}.${index}.body`)}
              rows={3}
            />
            <ControlledListField
              control={control}
              description={t('hint.onePerLine')}
              id={`${section}-highlights-${item.id}`}
              label={t('field.highlights')}
              name={`${section}.${index}.highlights`}
            />
            <ControlledLinksField
              control={control}
              description="Label | https://example.com"
              id={`${section}-links-${item.id}`}
              label={t('field.link')}
              name={`${section}.${index}.links`}
            />
          </CardContent>
        </Card>
      ))}
      <Button
        className="w-full border-dashed"
        variant="outline"
        onClick={() => items.append({ title: '', highlights: [] })}
      >
        <Plus data-icon="inline-start" />
        {t('common.add')} {t(`section.${section}`)}
      </Button>
    </div>
  );
}
