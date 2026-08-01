import { Download, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePreviewModel } from '@/models/preview-model';

export function FontConsent() {
  const { t } = useTranslation();
  const setFontPermission = usePreviewModel((state) => state.setFontPermission);
  return (
    <div className="flex min-h-full items-start justify-center p-8 pt-16">
      <Card className="max-w-md">
        <CardHeader>
          <span className="mb-2 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <CardTitle>{t('preview.fontConsentTitle')}</CardTitle>
          <CardDescription className="leading-6">
            {t('preview.fontConsentDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={() => setFontPermission('allowed')}>
            <Download data-icon="inline-start" />
            {t('preview.loadFont')}
          </Button>
          <Button variant="outline" onClick={() => setFontPermission('denied')}>
            {t('preview.continueWithoutFont')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
