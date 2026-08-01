import { TypstDocument } from '@myriaddreamin/typst.react';
import rendererWasmUrl from '@myriaddreamin/typst-ts-renderer/wasm?url';
import { CircleAlert, LoaderCircle, RefreshCw, Type } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePreviewModel } from '@/models/preview-model';
import { useResumeModel } from '@/models/resume-model';
import { FontConsent } from './font-consent';

TypstDocument.setWasmModuleInitOptions({
  beforeBuild: [],
  getModule: () => rendererWasmUrl,
});

export function LivePreview() {
  const resume = useResumeModel((state) => state.resume);
  const fontPermission = usePreviewModel((state) => state.fontPermission);
  const state = usePreviewModel((state) => state.state);
  const phase = usePreviewModel((state) => state.phase);
  const artifact = usePreviewModel((state) => state.artifact);
  const error = usePreviewModel((state) => state.error);
  const setFontPermission = usePreviewModel((model) => model.setFontPermission);
  const compile = usePreviewModel((model) => model.compile);

  useEffect(() => {
    if (fontPermission === 'unknown') return;
    const timer = setTimeout(() => void compile(resume), 300);
    return () => clearTimeout(timer);
  }, [compile, fontPermission, resume]);

  if (fontPermission === 'unknown') return <FontConsent />;

  if (state === 'error' && !artifact) {
    return (
      <div className="flex min-h-full items-start justify-center p-8 pt-16">
        <Card className="max-w-lg border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <CircleAlert className="size-5" />
              Preview compilation failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">
              {error}
            </pre>
            <div className="flex gap-2">
              <Button onClick={() => void compile(resume)}>
                <RefreshCw data-icon="inline-start" />
                Retry
              </Button>
              {fontPermission === 'denied' ? (
                <Button variant="outline" onClick={() => setFontPermission('allowed')}>
                  <Type data-icon="inline-start" />
                  Load template font
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-full p-8">
      {state === 'loading' && !artifact ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-muted/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm shadow-sm">
            <LoaderCircle className="size-4 animate-spin" />
            {phase ?? 'Preparing preview'}
          </div>
        </div>
      ) : null}
      {artifact ? (
        <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-sm bg-white shadow-xl [&_.typst-app]:!h-auto">
          <TypstDocument artifact={artifact} fill="#ffffff" />
        </div>
      ) : null}
    </div>
  );
}
