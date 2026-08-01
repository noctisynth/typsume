import { Download, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { TemplatePicker } from '@/components/template-picker/template-picker';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePreviewModel } from '@/models/preview-model';
import { useResumeModel } from '@/models/resume-model';

export function EditorHeader() {
  const { i18n, t } = useTranslation();
  const resume = useResumeModel((state) => state.resume);
  const previewState = usePreviewModel((state) => state.state);
  const fontPermission = usePreviewModel((state) => state.fontPermission);
  const artifact = usePreviewModel((state) => state.artifact);
  const exportPdf = usePreviewModel((state) => state.exportPdf);

  async function downloadPdf() {
    const bytes = await exportPdf(resume);
    const blob = new Blob([Uint8Array.from(bytes).buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const safeName = resume.basics.name.trim().replace(/[^\p{L}\p{N}._-]+/gu, '-') || 'resume';
    anchor.href = url;
    anchor.download = `${safeName}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur">
      <Link className="flex w-64 items-center gap-2 font-semibold tracking-tight" to="/">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          T
        </span>
        {t('common.appName')}
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
          {t('editor.eyebrow')}
        </p>
        <p className="truncate text-sm font-medium">
          {resume.basics.name || t('editor.titleFallback')}
        </p>
      </div>
      <TemplatePicker />
      <Separator className="h-6 data-vertical:self-center" orientation="vertical" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Change interface language"
            size="icon"
            variant="ghost"
            onClick={() => void i18n.changeLanguage(i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN')}
          >
            <Languages />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {i18n.language === 'zh-CN' ? 'Switch to English' : '切换至中文'}
        </TooltipContent>
      </Tooltip>
      <Button
        disabled={fontPermission === 'unknown' || !artifact || previewState === 'exporting'}
        onClick={() => void downloadPdf()}
      >
        <Download data-icon="inline-start" />
        {previewState === 'exporting' ? 'Exporting…' : t('common.exportPdf')}
      </Button>
    </header>
  );
}
