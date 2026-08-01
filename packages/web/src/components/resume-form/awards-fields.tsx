import type { ResumeInput, ResumeOutput } from '@typsume/core';
import { Plus, Trash2 } from 'lucide-react';
import { type Control, type UseFormRegister, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TextField } from './text-field';

interface AwardsFieldsProps {
  control: Control<ResumeInput, unknown, ResumeOutput>;
  register: UseFormRegister<ResumeInput>;
}

export function AwardsFields({ control, register }: AwardsFieldsProps) {
  const { t } = useTranslation();
  const awards = useFieldArray({ control, name: 'awards' });

  return (
    <div className="space-y-3">
      {awards.fields.map((award, index) => (
        <Card className="bg-muted/30 shadow-none" key={award.id}>
          <CardHeader className="flex-row items-center justify-between px-4 py-3">
            <span className="font-mono text-xs text-muted-foreground">
              {String(index + 1).padStart(2, '0')}
            </span>
            <Button size="icon-sm" variant="ghost" onClick={() => awards.remove(index)}>
              <Trash2 />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-4">
            <TextField
              id={`award-title-${award.id}`}
              label={t('field.awardTitle')}
              registration={register(`awards.${index}.title`)}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                id={`award-date-${award.id}`}
                label={t('field.awardDate')}
                registration={register(`awards.${index}.date`)}
              />
              <TextField
                id={`award-level-${award.id}`}
                label={t('field.awardLevel')}
                optional={t('common.optional')}
                registration={register(`awards.${index}.level`)}
              />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button
        className="w-full border-dashed"
        variant="outline"
        onClick={() => awards.append({ title: '', date: '' })}
      >
        <Plus data-icon="inline-start" />
        {t('common.add')} {t('section.awards')}
      </Button>
    </div>
  );
}
