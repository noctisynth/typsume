import type { ResumeInput, ResumeOutput } from '@typsume/core';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import type { Control, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { useFieldArray, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { photoAssetDataUrl, usePhotoModel } from '@/models/photo-model';
import { TextField } from './text-field';

interface BasicsFieldsProps {
  control: Control<ResumeInput, unknown, ResumeOutput>;
  register: UseFormRegister<ResumeInput>;
  setValue: UseFormSetValue<ResumeInput>;
}

export function BasicsFields({ control, register, setValue }: BasicsFieldsProps) {
  const { t } = useTranslation();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoPath = useWatch({ control, name: 'basics.photo' });
  const contacts = useFieldArray({ control, name: 'basics.contacts' });
  const photoAsset = usePhotoModel((state) => state.asset);
  const photoUploading = usePhotoModel((state) => state.uploading);
  const photoError = usePhotoModel((state) => state.error);
  const uploadPhoto = usePhotoModel((state) => state.upload);
  const clearPhoto = usePhotoModel((state) => state.clear);
  const activePhoto = photoAsset?.path === photoPath ? photoAsset : null;

  async function selectPhoto(file: File) {
    const asset = await uploadPhoto(file);
    if (!asset) return;
    setValue('basics.photo', asset.path, { shouldDirty: true, shouldValidate: true });
  }

  function removePhoto() {
    clearPhoto();
    setValue('basics.photo', undefined, { shouldDirty: true, shouldValidate: true });
  }

  return (
    <div className="space-y-5">
      <TextField id="basics-name" label={t('field.name')} registration={register('basics.name')} />
      <TextField
        id="basics-title"
        label={t('field.title')}
        optional={t('common.optional')}
        registration={register('basics.title')}
      />
      <input type="hidden" {...register('basics.photo')} />
      <input
        ref={photoInputRef}
        accept="image/png,image/jpeg"
        className="sr-only"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void selectPhoto(file);
          event.target.value = '';
        }}
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{t('field.photo')}</p>
          <span className="text-xs text-muted-foreground">{t('common.optional')}</span>
        </div>
        <Card className="bg-muted/30 shadow-none">
          <CardContent className="flex items-center gap-3 p-3">
            {activePhoto ? (
              <img
                alt={t('photo.previewAlt')}
                className="size-16 rounded-lg border bg-background object-cover"
                src={photoAssetDataUrl(activePhoto)}
              />
            ) : (
              <div className="grid size-16 place-items-center rounded-lg border bg-background text-muted-foreground">
                <ImagePlus className="size-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {activePhoto?.fileName ?? photoPath ?? t('photo.empty')}
              </p>
              <p className="mt-1 text-xs leading-4 text-muted-foreground">
                {photoPath && !activePhoto ? t('photo.missingAsset') : t('photo.help')}
              </p>
              {photoError ? (
                <p className="mt-1 text-xs text-destructive">{t(`photo.error.${photoError}`)}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <Button
                disabled={photoUploading}
                size="sm"
                type="button"
                variant="outline"
                onClick={() => photoInputRef.current?.click()}
              >
                <ImagePlus data-icon="inline-start" />
                {photoUploading ? t('photo.uploading') : t('photo.upload')}
              </Button>
              {photoPath ? (
                <Button
                  aria-label={t('photo.remove')}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                  onClick={removePhoto}
                >
                  <Trash2 />
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

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
