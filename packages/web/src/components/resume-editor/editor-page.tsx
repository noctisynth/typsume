import { useTranslation } from 'react-i18next';
import { ResumeForm } from '@/components/resume-form/resume-form';
import { LivePreview } from '@/components/resume-preview/live-preview';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { usePreviewModel } from '@/models/preview-model';
import { useResumeModel } from '@/models/resume-model';
import { EditorHeader } from './editor-header';
import { EditorStatusBar } from './editor-status-bar';
import { ResumeOutline } from './resume-outline';

export default function EditorPage() {
  const { t } = useTranslation();
  const hydrated = useResumeModel((state) => state.hydrated);
  const previewState = usePreviewModel((state) => state.state);
  const phase = usePreviewModel((state) => state.phase);

  if (!hydrated) {
    return (
      <main className="grid min-h-svh grid-cols-[390px_1fr_220px] gap-px bg-border">
        <Skeleton className="h-full rounded-none" />
        <Skeleton className="h-full rounded-none" />
        <Skeleton className="h-full rounded-none" />
      </main>
    );
  }

  return (
    <main className="flex h-svh min-w-[1180px] flex-col overflow-hidden bg-muted/60">
      <EditorHeader />
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(390px,31vw)_minmax(560px,1fr)_220px]">
        <aside className="min-h-0 border-r bg-background">
          <div className="flex h-11 items-center justify-between border-b px-4">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {t('editor.form')}
            </p>
            <span className="font-mono text-[10px] text-muted-foreground">JSON 1.0</span>
          </div>
          <ScrollArea className="h-[calc(100%-2.75rem)]">
            <ResumeForm />
          </ScrollArea>
        </aside>
        <section className="min-h-0 min-w-0">
          <div className="flex h-11 items-center justify-between border-b px-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2 font-medium text-foreground">
              <i
                className={
                  previewState === 'ready'
                    ? 'size-1.5 rounded-full bg-emerald-600'
                    : previewState === 'error'
                      ? 'size-1.5 rounded-full bg-destructive'
                      : 'size-1.5 rounded-full bg-amber-500'
                }
              />
              {t('editor.preview')}
            </span>
            <span>{phase ?? '100%'}</span>
          </div>
          <ScrollArea className="h-[calc(100%-2.75rem)]">
            <LivePreview />
          </ScrollArea>
        </section>
        <aside className="min-h-0 border-l bg-background">
          <ResumeOutline />
        </aside>
      </div>
      <EditorStatusBar />
    </main>
  );
}
