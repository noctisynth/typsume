import { Download, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePreviewModel } from '@/models/preview-model';

export function FontConsent() {
  const setFontPermission = usePreviewModel((state) => state.setFontPermission);
  return (
    <div className="flex min-h-full items-start justify-center p-8 pt-16">
      <Card className="max-w-md">
        <CardHeader>
          <span className="mb-2 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <CardTitle>Load the template font?</CardTitle>
          <CardDescription className="leading-6">
            The default template uses a remote open-source font. It is downloaded only after your
            confirmation, kept in memory for this page, and never stored in IndexedDB.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={() => setFontPermission('allowed')}>
            <Download data-icon="inline-start" />
            Load font and preview
          </Button>
          <Button variant="outline" onClick={() => setFontPermission('denied')}>
            Continue without it
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
