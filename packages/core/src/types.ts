export type {
  AwardInput,
  AwardOutput,
  BasicsInput,
  BasicsOutput,
  ContactInput,
  ContactOutput,
  ItemBlockInput,
  ItemBlockOutput,
  ItemLinkInput,
  ItemLinkOutput,
  ResumeInput,
  ResumeMetaInput,
  ResumeMetaOutput,
  ResumeOutput,
  SkillItemInput,
  SkillItemOutput,
  SkillSectionInput,
  SkillSectionOutput,
} from './schema.ts';

import type { z } from 'zod';
import { ResumeSchema } from './schema.ts';

export type ResumeData = z.infer<typeof ResumeSchema>;

export { ResumeSchema };
