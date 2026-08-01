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
              {warnings.length} resource warning{warnings.length === 1 ? '' : 's'}
            </TooltipTrigger>
            <TooltipContent className="max-w-md space-y-2">
              {warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <span>Typst · default · A4{latencyMs === null ? '' : ` · ${latencyMs}ms`}</span>
    </footer>
  );
}
