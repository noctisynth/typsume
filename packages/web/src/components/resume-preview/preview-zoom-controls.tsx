import { Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PREVIEW_ZOOM_MAX,
  PREVIEW_ZOOM_MIN,
  usePreviewViewportModel,
} from '@/models/preview-viewport-model';

const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200];

export function PreviewZoomControls({ enabled }: { enabled: boolean }) {
  const { t } = useTranslation();
  const zoom = usePreviewViewportModel((state) => state.zoom);
  const setZoom = usePreviewViewportModel((state) => state.setZoom);
  const zoomIn = usePreviewViewportModel((state) => state.zoomIn);
  const zoomOut = usePreviewViewportModel((state) => state.zoomOut);

  return (
    <div className="flex items-center gap-0.5">
      <Button
        aria-label={t('zoom.decrease')}
        disabled={!enabled || zoom <= PREVIEW_ZOOM_MIN}
        onClick={zoomOut}
        size="icon-xs"
        variant="ghost"
      >
        <Minus />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={t('zoom.select')}
            className="w-14 px-1 font-mono tabular-nums"
            disabled={!enabled}
            size="xs"
            variant="ghost"
          >
            {zoom}%
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-28 min-w-28">
          <DropdownMenuLabel>{t('zoom.title')}</DropdownMenuLabel>
          {ZOOM_PRESETS.map((preset) => (
            <DropdownMenuItem key={preset} onSelect={() => setZoom(preset)}>
              <span className="font-mono tabular-nums">{preset}%</span>
              {preset === 100 ? (
                <span className="ml-auto text-xs text-muted-foreground">{t('zoom.reset')}</span>
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        aria-label={t('zoom.increase')}
        disabled={!enabled || zoom >= PREVIEW_ZOOM_MAX}
        onClick={zoomIn}
        size="icon-xs"
        variant="ghost"
      >
        <Plus />
      </Button>
    </div>
  );
}
