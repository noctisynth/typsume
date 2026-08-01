import { useTranslation } from 'react-i18next';

export function EditorStatusBar() {
  const { t } = useTranslation();
  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t bg-background px-4 font-mono text-[10px] text-muted-foreground">
      <span className="flex items-center gap-2">
        <i className="size-1.5 rounded-full bg-emerald-600" />
        {t('editor.saved')}
      </span>
      <span>Typst · default · A4</span>
    </footer>
  );
}
