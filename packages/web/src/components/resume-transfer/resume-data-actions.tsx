import { Download, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  detectResumeFormat,
  parseResumeSource,
  type ResumeSourceFormat,
  serializeResume,
} from '@/lib/resume-format';
import { useResumeModel } from '@/models/resume-model';

export function ResumeDataActions() {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<ResumeSourceFormat>('toml');
  const [error, setError] = useState<string | null>(null);
  const resume = useResumeModel((state) => state.resume);
  const importResume = useResumeModel((state) => state.importResume);

  function exportResume() {
    const blob = new Blob([serializeResume(resume, format)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const safeName = resume.basics.name.trim().replace(/[^\p{L}\p{N}._-]+/gu, '-') || 'resume';
    anchor.href = url;
    anchor.download = `${safeName}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(file: File) {
    try {
      const imported = parseResumeSource(await file.text(), detectResumeFormat(file.name));
      if (!importResume(imported)) throw new Error('Resume schema validation failed.');
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  return (
    <div className="relative flex items-center gap-1">
      <Select value={format} onValueChange={(value) => setFormat(value as ResumeSourceFormat)}>
        <SelectTrigger aria-label={t('data.format')} className="h-7 w-20 text-[10px] uppercase">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="toml">TOML</SelectItem>
          <SelectItem value="json">JSON</SelectItem>
          <SelectItem value="yaml">YAML</SelectItem>
        </SelectContent>
      </Select>
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
        size="icon-sm"
        type="button"
        variant="ghost"
        onClick={() => inputRef.current?.click()}
      >
        <Upload />
      </Button>
      <Button
        aria-label={t('data.export')}
        size="icon-sm"
        type="button"
        variant="ghost"
        onClick={exportResume}
      >
        <Download />
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
