import { ChevronDown, Download, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
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
  detectResumeFormat,
  parseResumeSource,
  type ResumeSourceFormat,
  serializeResume,
} from '@/lib/resume-format';
import { useResumeModel } from '@/models/resume-model';

function downloadResume(
  resume: ReturnType<typeof useResumeModel.getState>['resume'],
  format: ResumeSourceFormat,
) {
  const blob = new Blob([serializeResume(resume, format)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeName = resume.basics.name.trim().replace(/[^\p{L}\p{N}._-]+/gu, '-') || 'resume';
  anchor.href = url;
  anchor.download = `${safeName}.${format}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ResumeImportAction() {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const importResume = useResumeModel((state) => state.importResume);

  async function importFile(file: File) {
    try {
      const imported = parseResumeSource(await file.text(), detectResumeFormat(file.name));
      if (!importResume(imported)) throw new Error(t('data.invalidSchema'));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        accept=".json,.yaml,.yml,.toml,application/json,text/yaml,application/toml"
        className="sr-only"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importFile(file);
          event.target.value = '';
        }}
      />
      <Button
        aria-label={t('data.import')}
        size="sm"
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
      >
        <Upload data-icon="inline-start" />
        {t('data.import')}
      </Button>
      {error ? (
        <p
          className="absolute top-full right-0 z-50 mt-2 w-80 whitespace-pre-wrap rounded-lg border border-destructive/30 bg-background p-3 text-xs text-destructive shadow-lg"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ResumeDownloadMenu() {
  const { t } = useTranslation();
  const resume = useResumeModel((state) => state.resume);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={t('data.download')} type="button" variant="outline">
          <Download data-icon="inline-start" />
          {t('data.download')}
          <ChevronDown data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>{t('data.downloadFormat')}</DropdownMenuLabel>
        <DropdownMenuItem
          className="items-start py-2"
          onSelect={() => downloadResume(resume, 'toml')}
        >
          <span className="flex flex-col gap-0.5">
            <span className="font-medium">TOML</span>
            <span className="text-xs leading-4 text-muted-foreground">{t('data.tomlCliHint')}</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => downloadResume(resume, 'json')}>JSON</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => downloadResume(resume, 'yaml')}>YAML</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
