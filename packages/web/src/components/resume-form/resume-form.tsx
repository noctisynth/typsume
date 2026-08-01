import { zodResolver } from '@hookform/resolvers/zod';
import {
  RESUME_SCHEMA_VERSION,
  type ResumeInput,
  type ResumeOutput,
  ResumeSchema,
} from '@typsume/core';
import { Check, RotateCcw, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { findNewlyOpenedSection } from '@/lib/accordion-state';
import { DEFAULT_RESUME, RESUME_SECTIONS, useResumeModel } from '@/models/resume-model';
import { AwardsFields } from './awards-fields';
import { BasicsFields } from './basics-fields';
import { ItemFields } from './item-fields';
import { MetaFields } from './meta-fields';
import { SkillsFields } from './skills-fields';

export function ResumeForm() {
  const { t } = useTranslation();
  const resume = useResumeModel((state) => state.resume);
  const selectedSection = useResumeModel((state) => state.selectedSection);
  const sectionNavigationRevision = useResumeModel((state) => state.sectionNavigationRevision);
  const replaceResume = useResumeModel((state) => state.replaceResume);
  const resetResume = useResumeModel((state) => state.resetResume);
  const selectSection = useResumeModel((state) => state.selectSection);
  const [openSections, setOpenSections] = useState<string[]>([selectedSection]);
  const form = useForm<ResumeInput, unknown, ResumeOutput>({
    resolver: zodResolver(ResumeSchema),
    defaultValues: resume,
    mode: 'onChange',
  });
  const values = useWatch({ control: form.control });
  const locale = useWatch({ control: form.control, name: 'meta.locale' });

  useEffect(() => {
    if (sectionNavigationRevision === 0) return;
    const section = useResumeModel.getState().selectedSection;
    setOpenSections((current) => (current.includes(section) ? current : [...current, section]));
  }, [sectionNavigationRevision]);

  useEffect(() => {
    const timer = setTimeout(() => replaceResume(values), 300);
    return () => clearTimeout(timer);
  }, [replaceResume, values]);

  function resetToSample() {
    form.reset(DEFAULT_RESUME);
    resetResume();
  }

  function changeOpenSections(nextSections: string[]) {
    const openedSection = findNewlyOpenedSection(openSections, nextSections);
    setOpenSections(nextSections);
    if (
      openedSection &&
      RESUME_SECTIONS.includes(openedSection as (typeof RESUME_SECTIONS)[number])
    ) {
      selectSection(openedSection as (typeof RESUME_SECTIONS)[number]);
    }
  }

  return (
    <form className="space-y-3 px-4 pb-6" onSubmit={(event) => event.preventDefault()}>
      <div className="flex items-start justify-between gap-3 py-4">
        <p className="max-w-64 text-xs leading-5 text-muted-foreground">{t('hint.autoSave')}</p>
        <Badge variant={form.formState.isValid ? 'secondary' : 'destructive'}>
          {form.formState.isValid ? <Check /> : <TriangleAlert />}
          {form.formState.isValid ? 'Schema valid' : 'Check fields'}
        </Badge>
      </div>
      <Separator />
      <input type="hidden" value={RESUME_SCHEMA_VERSION} {...form.register('schema')} />
      <Accordion
        className="w-full"
        type="multiple"
        value={openSections}
        onValueChange={changeOpenSections}
      >
        {RESUME_SECTIONS.map((section, index) => (
          <AccordionItem id={`section-${section}`} key={section} value={section}>
            <AccordionTrigger className="py-4 hover:no-underline">
              <span className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{t(`section.${section}`)}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-5 pl-7">
              {section === 'basics' ? (
                <BasicsFields control={form.control} register={form.register} />
              ) : null}
              {section === 'skills' ? (
                <SkillsFields control={form.control} register={form.register} />
              ) : null}
              {section === 'education' || section === 'experience' || section === 'projects' ? (
                <ItemFields control={form.control} register={form.register} section={section} />
              ) : null}
              {section === 'awards' ? (
                <AwardsFields control={form.control} register={form.register} />
              ) : null}
              {section === 'meta' ? (
                <MetaFields
                  locale={locale}
                  register={form.register}
                  setLocale={(nextLocale) => form.setValue('meta.locale', nextLocale)}
                />
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Button className="w-full" variant="ghost" onClick={resetToSample}>
        <RotateCcw data-icon="inline-start" />
        {t('common.reset')}
      </Button>
    </form>
  );
}
