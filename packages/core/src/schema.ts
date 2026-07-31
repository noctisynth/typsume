import { z } from 'zod';

export const CONTACT_ICON_VALUES = [
  'email',
  'phone',
  'github',
  'gitlab',
  'website',
  'linkedin',
  'twitter',
  'location',
] as const;

export const SKILL_LEVELS = ['精通', '熟悉', '了解'] as const;

export const RESUME_SCHEMA_VERSION = 'typst-resume/1.0' as const;

export const ContactSchema = z.object({
  icon: z.string().min(1),
  text: z.string().min(1),
  link: z.string().url().optional(),
});

export const BasicsSchema = z.object({
  name: z.string().min(1),
  photo: z.string().optional(),
  title: z.string().optional(),
  contacts: z.array(ContactSchema).default([]),
});

export const SkillItemSchema = z.object({
  name: z.string().min(1),
  level: z.enum(SKILL_LEVELS).optional(),
});

export const SkillSectionSchema = z.object({
  name: z.string().min(1),
  items: z.array(SkillItemSchema).min(1),
});

export const ItemLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().url(),
});

export const ItemBlockSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  period: z.string().optional(),
  department: z.string().optional(),
  stack: z.array(z.string()).optional(),
  links: z.array(ItemLinkSchema).optional(),
  body: z.string().optional(),
  highlights: z.array(z.string()).default([]),
  extra: z.record(z.string(), z.unknown()).optional(),
});

export const AwardSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  level: z.string().optional(),
});

export const ResumeMetaSchema = z.object({
  template: z.string().optional(),
  locale: z.string().optional(),
  fontSize: z.number().positive().optional(),
});

export const ResumeSchema = z.object({
  schema: z.literal(RESUME_SCHEMA_VERSION),
  basics: BasicsSchema,
  skills: z.array(SkillSectionSchema).default([]),
  education: z.array(ItemBlockSchema).default([]),
  experience: z.array(ItemBlockSchema).default([]),
  projects: z.array(ItemBlockSchema).default([]),
  awards: z.array(AwardSchema).default([]),
  meta: ResumeMetaSchema.optional(),
});

export type ContactInput = z.input<typeof ContactSchema>;
export type ContactOutput = z.output<typeof ContactSchema>;
export type BasicsInput = z.input<typeof BasicsSchema>;
export type BasicsOutput = z.output<typeof BasicsSchema>;
export type SkillItemInput = z.input<typeof SkillItemSchema>;
export type SkillItemOutput = z.output<typeof SkillItemSchema>;
export type SkillSectionInput = z.input<typeof SkillSectionSchema>;
export type SkillSectionOutput = z.output<typeof SkillSectionSchema>;
export type ItemLinkInput = z.input<typeof ItemLinkSchema>;
export type ItemLinkOutput = z.output<typeof ItemLinkSchema>;
export type ItemBlockInput = z.input<typeof ItemBlockSchema>;
export type ItemBlockOutput = z.output<typeof ItemBlockSchema>;
export type AwardInput = z.input<typeof AwardSchema>;
export type AwardOutput = z.output<typeof AwardSchema>;
export type ResumeMetaInput = z.input<typeof ResumeMetaSchema>;
export type ResumeMetaOutput = z.output<typeof ResumeMetaSchema>;
export type ResumeInput = z.input<typeof ResumeSchema>;
export type ResumeOutput = z.output<typeof ResumeSchema>;
