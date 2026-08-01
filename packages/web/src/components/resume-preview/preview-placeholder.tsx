import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

export function PreviewPlaceholder() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-full items-start justify-center p-8">
      <Card className="aspect-[210/297] w-full max-w-2xl rounded-sm shadow-xl">
        <CardContent className="grid h-full place-items-center p-16 text-center">
          <div className="max-w-sm space-y-4">
            <span className="mx-auto grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <FileText className="size-5" />
            </span>
            <h2 className="font-heading text-xl font-semibold">{t('editor.preview')}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{t('hint.previewPending')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
