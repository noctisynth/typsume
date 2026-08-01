import { Trash2, Upload } from 'lucide-react';
import { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFontModel } from '@/models/font-model';

const TEMPLATE_DEFAULT = '__template-default__';

export function FontSelector() {
  const { t } = useTranslation();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const files = useFontModel((state) => state.files);
  const selectedFamily = useFontModel((state) => state.selectedFamily);
  const uploading = useFontModel((state) => state.uploading);
  const error = useFontModel((state) => state.error);
  const uploadFiles = useFontModel((state) => state.uploadFiles);
  const selectFamily = useFontModel((state) => state.selectFamily);
  const clearUploads = useFontModel((state) => state.clearUploads);
  const families = [...new Set(files.flatMap((file) => file.families))];

  return (
    <Field>
      <FieldLabel htmlFor={inputId}>{t('field.fontFamily')}</FieldLabel>
      <Select
        value={selectedFamily ?? TEMPLATE_DEFAULT}
        onValueChange={(value) => selectFamily(value === TEMPLATE_DEFAULT ? null : value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TEMPLATE_DEFAULT}>{t('font.templateDefault')}</SelectItem>
          {families.map((family) => (
            <SelectItem key={family} value={family}>
              {family}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input
        ref={inputRef}
        className="sr-only"
        id={inputId}
        accept=".ttf,.otf,.ttc,font/ttf,font/otf"
        multiple
        type="file"
        onChange={(event) => {
          void uploadFiles(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          className="flex-1"
          disabled={uploading}
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          <Upload data-icon="inline-start" />
          {uploading ? t('font.reading') : t('font.upload')}
        </Button>
        {files.length > 0 ? (
          <Button
            type="button"
            aria-label={t('font.clear')}
            size="icon"
            variant="ghost"
            onClick={clearUploads}
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>
      <FieldDescription>{t('font.pageLifetime')}</FieldDescription>
      {files.length > 0 ? (
        <FieldDescription>
          {t('font.loadedFiles', {
            count: files.length,
            names: files.map((file) => file.fileName).join(', '),
          })}
        </FieldDescription>
      ) : null}
      <FieldError>{error}</FieldError>
    </Field>
  );
}
