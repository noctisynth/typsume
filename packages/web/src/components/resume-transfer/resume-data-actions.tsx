import { Archive, ChevronDown, Download, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createProjectBundle } from '@/lib/project-bundle';
import {
  detectResumeFormat,
  parseResumeSource,
  type ResumeSourceFormat,
  serializeResume,
} from '@/lib/resume-format';
import { DEFAULT_TEMPLATE } from '@/lib/template-registry';
import { getPhotoAsset, usePhotoModel } from '@/models/photo-model';
import { useResumeModel } from '@/models/resume-model';
import { useStyleModel } from '@/models/style-model';

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
      usePhotoModel.getState().clear();
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
  const [error, setError] = useState<string | null>(null);
  const resume = useResumeModel((state) => state.resume);
  const photoRevision = usePhotoModel((state) => state.revision);
  const overrides = useStyleModel((state) => state.overrides);

  function downloadProject() {
    try {
      const bytes = createProjectBundle(
        resume,
        { ...DEFAULT_TEMPLATE.configDefaults, ...overrides },
        getPhotoAsset(photoRevision),
      );
      const url = URL.createObjectURL(
        new Blob([Uint8Array.from(bytes).buffer], { type: 'application/zip' }),
      );
      const anchor = document.createElement('a');
      const safeName = resume.basics.name.trim().replace(/[^\p{L}\p{N}._-]+/gu, '-') || 'resume';
      anchor.href = url;
      anchor.download = `${safeName}-project.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message === 'missing-photo-asset'
          ? t('data.missingPhotoAsset')
          : t('data.projectExportFailed'),
      );
    }
  }

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label={t('data.download')} type="button" variant="outline">
            <Download data-icon="inline-start" />
            {t('data.download')}
            <ChevronDown data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="space-y-1.5 py-2">
            <span className="block">{t('data.downloadFormat')}</span>
            <span className="block text-xs leading-4 font-normal text-muted-foreground">
              {t('data.cliHint')}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => downloadResume(resume, 'toml')}>TOML</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => downloadResume(resume, 'json')}>JSON</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => downloadResume(resume, 'yaml')}>YAML</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="items-start py-2" onSelect={downloadProject}>
            <Archive className="mt-0.5" />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{t('data.downloadProject')}</span>
              <span className="text-xs leading-4 text-muted-foreground">
                {t('data.projectHint')}
              </span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error ? (
        <p
          className="absolute top-full right-0 z-50 mt-2 w-80 rounded-lg border border-destructive/30 bg-background p-3 text-xs text-destructive shadow-lg"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
