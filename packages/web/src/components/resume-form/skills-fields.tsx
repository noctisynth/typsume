import { type ResumeInput, type ResumeOutput, SKILL_LEVELS } from '@typsume/core';
import { Plus, Trash2 } from 'lucide-react';
import { type Control, Controller, type UseFormRegister, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { TextField } from './text-field';

interface SkillsFieldsProps {
  control: Control<ResumeInput, unknown, ResumeOutput>;
  register: UseFormRegister<ResumeInput>;
}

export function SkillsFields({ control, register }: SkillsFieldsProps) {
  const { t } = useTranslation();
  const groups = useFieldArray({ control, name: 'skills' });

  return (
    <div className="space-y-3">
      {groups.fields.map((group, index) => (
        <Card className="bg-muted/30 shadow-none" key={group.id}>
          <CardHeader className="flex-row items-center justify-between px-4 py-3">
            <span className="font-mono text-xs text-muted-foreground">
              {String(index + 1).padStart(2, '0')}
            </span>
            <Button size="icon-sm" variant="ghost" onClick={() => groups.remove(index)}>
              <Trash2 />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-4">
            <TextField
              id={`skill-group-${group.id}`}
              label={t('field.sectionName')}
              registration={register(`skills.${index}.name`)}
            />
            <Controller
              control={control}
              name={`skills.${index}.items`}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={`skill-items-${group.id}`}>{t('field.itemName')}</FieldLabel>
                  <Textarea
                    id={`skill-items-${group.id}`}
                    rows={4}
                    value={(field.value ?? [])
                      .map((item) => `${item.name}${item.level ? ` | ${item.level}` : ''}`)
                      .join('\n')}
                    onBlur={field.onBlur}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value
                          .split('\n')
                          .map((line) => {
                            const [name, rawLevel] = line.split('|').map((part) => part.trim());
                            const level = SKILL_LEVELS.find((candidate) => candidate === rawLevel);
                            return level ? { name: name ?? '', level } : { name: name ?? '' };
                          })
                          .filter((item) => item.name),
                      )
                    }
                  />
                  <FieldDescription>TypeScript | 熟悉</FieldDescription>
                </Field>
              )}
            />
          </CardContent>
        </Card>
      ))}
      <Button
        className="w-full border-dashed"
        variant="outline"
        onClick={() => groups.append({ name: '', items: [{ name: '' }] })}
      >
        <Plus data-icon="inline-start" />
        {t('common.add')} {t('section.skills')}
      </Button>
    </div>
  );
}
