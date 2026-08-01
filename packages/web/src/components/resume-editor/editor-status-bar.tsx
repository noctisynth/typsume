import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePreviewModel } from '@/models/preview-model';

export function EditorStatusBar() {
  const { t } = useTranslation();
  const warnings = usePreviewModel((state) => state.warnings);
  const latencyMs = usePreviewModel((state) => state.latencyMs);
  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t bg-background px-4 font-mono text-[10px] text-muted-foreground">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2">
          <i className="size-1.5 rounded-full bg-emerald-600" />
          {t('editor.saved')}
        </span>
        {warnings.length > 0 ? (
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1 text-amber-700">
              <TriangleAlert className="size-3" />
              {t('preview.resourceWarnings', { count: warnings.length })}
            </TooltipTrigger>
            <TooltipContent className="w-[min(32rem,var(--radix-tooltip-content-available-width))] max-w-none flex-col items-stretch gap-0 p-1">
              {warnings.map((warning) => (
                <div
                  className="flex items-start gap-2 rounded-sm px-2 py-1.5 leading-relaxed"
                  key={warning}
                >
                  <TriangleAlert className="mt-0.5 size-3 shrink-0 text-amber-400" />
                  <p className="min-w-0 flex-1 text-left">{warning}</p>
                </div>
              ))}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <span>
        Typst · {t('common.defaultTemplate')} · A4
        {latencyMs === null ? '' : ` · ${latencyMs}ms`}
      </span>
    </footer>
  );
}
