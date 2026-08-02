import { CircleAlert, LoaderCircle, RefreshCw, Type } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useContactIconModel } from '@/models/contact-icon-model';
import { useFontModel } from '@/models/font-model';
import { usePhotoModel } from '@/models/photo-model';
import { usePreviewModel } from '@/models/preview-model';
import { usePreviewViewportModel } from '@/models/preview-viewport-model';
import { useResumeModel } from '@/models/resume-model';
import { useStyleModel } from '@/models/style-model';
import { FontConsent } from './font-consent';
import { TypstPreviewDocument } from './typst-preview-document';

export function LivePreview() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const resume = useResumeModel((state) => state.resume);
  const fontPermission = usePreviewModel((state) => state.fontPermission);
  const state = usePreviewModel((state) => state.state);
  const phase = usePreviewModel((state) => state.phase);
  const artifact = usePreviewModel((state) => state.artifact);
  const error = usePreviewModel((state) => state.error);
  const setFontPermission = usePreviewModel((model) => model.setFontPermission);
  const compile = usePreviewModel((model) => model.compile);
  const fontRevision = useFontModel((model) => model.revision);
  const photoRevision = usePhotoModel((model) => model.revision);
  const contactIconRevision = useContactIconModel((model) => model.revision);
  const styleRevision = useStyleModel((model) => model.revision);
  const zoom = usePreviewViewportModel((model) => model.zoom);
  const setZoom = usePreviewViewportModel((model) => model.setZoom);
  const zoomByWheel = usePreviewViewportModel((model) => model.zoomByWheel);

  useEffect(() => {
    if (fontPermission === 'unknown') return;
    const timer = setTimeout(
      () => void compile(resume, fontRevision, styleRevision, photoRevision, contactIconRevision),
      300,
    );
    return () => clearTimeout(timer);
  }, [
    compile,
    contactIconRevision,
    fontPermission,
    fontRevision,
    photoRevision,
    resume,
    styleRevision,
  ]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let gestureStartZoom = usePreviewViewportModel.getState().zoom;
    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      if (!usePreviewModel.getState().artifact) return;
      event.preventDefault();
      zoomByWheel(event.deltaY, event.deltaMode);
    };
    const handleGestureStart = (event: Event) => {
      if (!usePreviewModel.getState().artifact) return;
      event.preventDefault();
      gestureStartZoom = usePreviewViewportModel.getState().zoom;
    };
    const handleGestureChange = (event: Event) => {
      if (!usePreviewModel.getState().artifact) return;
      event.preventDefault();
      const scale = (event as Event & { scale?: number }).scale ?? 1;
      setZoom(gestureStartZoom * scale);
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    viewport.addEventListener('gesturestart', handleGestureStart, { passive: false });
    viewport.addEventListener('gesturechange', handleGestureChange, { passive: false });
    return () => {
      viewport.removeEventListener('wheel', handleWheel);
      viewport.removeEventListener('gesturestart', handleGestureStart);
      viewport.removeEventListener('gesturechange', handleGestureChange);
    };
  }, [setZoom, zoomByWheel]);

  let content = null;
  if (fontPermission === 'unknown') {
    content = <FontConsent />;
  } else if (state === 'error' && !artifact) {
    content = (
      <div className="flex min-h-full items-start justify-center p-8 pt-16">
        <Card className="max-w-lg border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <CircleAlert className="size-5" />
              {t('preview.compilationFailed')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">
              {error}
            </pre>
            <div className="flex gap-2">
              <Button onClick={() => void compile(resume)}>
                <RefreshCw data-icon="inline-start" />
                {t('preview.retry')}
              </Button>
              {fontPermission === 'denied' ? (
                <Button variant="outline" onClick={() => setFontPermission('allowed')}>
                  <Type data-icon="inline-start" />
                  {t('preview.loadTemplateFont')}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } else {
    content = (
      <div className="relative min-h-full min-w-full p-8">
        {state === 'loading' && !artifact ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-muted/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm shadow-sm">
              <LoaderCircle className="size-4 animate-spin" />
              {phase ? t(`preview.phase.${phase}`) : t('preview.preparing')}
            </div>
          </div>
        ) : null}
        {artifact ? (
          <div
            className="mx-auto overflow-hidden rounded-sm bg-white shadow-xl [&_.typst-app]:!h-auto"
            style={{ width: `min(${zoom}%, ${(42 * zoom) / 100}rem)` }}
          >
            <TypstPreviewDocument artifact={artifact} fill="#ffffff" />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={viewportRef} className="min-h-full min-w-full">
      {content}
    </div>
  );
}
