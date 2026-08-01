import { LockKeyhole } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { calculateContainedScrollTop } from '@/lib/outline-scroll';
import { RESUME_SECTIONS, type ResumeSection, useResumeModel } from '@/models/resume-model';

export function ResumeOutline() {
  const { t } = useTranslation();
  const selectedSection = useResumeModel((state) => state.selectedSection);
  const navigateSection = useResumeModel((state) => state.navigateSection);

  function navigate(section: ResumeSection) {
    navigateSection(section);
    const viewport = document.querySelector<HTMLElement>(
      '#resume-form-scroll-area [data-slot="scroll-area-viewport"]',
    );
    const target = document.getElementById(`section-${section}`);
    if (!viewport || !target) return;
    const viewportTop = viewport.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;
    viewport.scrollTo({
      behavior: 'smooth',
      top: calculateContainedScrollTop(viewport.scrollTop, viewportTop, targetTop),
    });
  }

  return (
    <nav className="flex h-full flex-col p-4" aria-label={t('editor.outline')}>
      <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        {t('editor.outline')}
      </p>
      <Separator className="my-4 w-8 bg-primary" />
      <div className="space-y-1">
        {RESUME_SECTIONS.map((section, index) => (
          <Button
            type="button"
            className="w-full justify-start px-2 font-normal"
            key={section}
            size="sm"
            variant={selectedSection === section ? 'secondary' : 'ghost'}
            onClick={() => navigate(section)}
          >
            <span className="w-5 font-mono text-[10px] text-muted-foreground">
              {String(index + 1).padStart(2, '0')}
            </span>
            {t(`section.${section}`)}
          </Button>
        ))}
      </div>
      <div className="mt-auto flex gap-2 border-t pt-4 text-xs leading-5 text-muted-foreground">
        <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
        <p>{t('editor.private')}</p>
      </div>
    </nav>
  );
}
