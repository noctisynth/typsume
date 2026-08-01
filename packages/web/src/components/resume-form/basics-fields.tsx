import type { ResumeInput, ResumeOutput } from '@typsume/core';
import { Plus, Trash2 } from 'lucide-react';
import type { Control, UseFormRegister } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TextField } from './text-field';

interface BasicsFieldsProps {
  control: Control<ResumeInput, unknown, ResumeOutput>;
  register: UseFormRegister<ResumeInput>;
}

export function BasicsFields({ control, register }: BasicsFieldsProps) {
  const { t } = useTranslation();
  const contacts = useFieldArray({ control, name: 'basics.contacts' });

  return (
    <div className="space-y-5">
      <TextField id="basics-name" label={t('field.name')} registration={register('basics.name')} />
      <TextField
        id="basics-title"
        label={t('field.title')}
        optional={t('common.optional')}
        registration={register('basics.title')}
      />
      <TextField
        id="basics-photo"
        label={t('field.photo')}
        optional={t('common.optional')}
        registration={register('basics.photo', {
          setValueAs: (value) => value || undefined,
        })}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{t('field.contacts')}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => contacts.append({ icon: 'email', text: '' })}
          >
            <Plus data-icon="inline-start" />
            {t('common.add')}
          </Button>
        </div>
        {contacts.fields.map((contact, index) => (
          <Card className="bg-muted/30 shadow-none" key={contact.id}>
            <CardContent className="grid grid-cols-[0.7fr_1.2fr_1.4fr_auto] items-end gap-3 p-3">
              <TextField
                id={`contact-icon-${contact.id}`}
                label={t('field.icon')}
                registration={register(`basics.contacts.${index}.icon`)}
              />
              <TextField
                id={`contact-text-${contact.id}`}
                label={t('field.text')}
                registration={register(`basics.contacts.${index}.text`)}
              />
              <TextField
                id={`contact-link-${contact.id}`}
                label={t('field.link')}
                optional={t('common.optional')}
                registration={register(`basics.contacts.${index}.link`, {
                  setValueAs: (value) => value || undefined,
                })}
              />
              <Button
                aria-label={`${t('common.remove')} ${t('field.contacts')}`}
                size="icon"
                variant="ghost"
                onClick={() => contacts.remove(index)}
              >
                <Trash2 />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
