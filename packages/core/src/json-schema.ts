import { z } from 'zod';
import { ResumeSchema } from './schema.ts';

export const resumeJsonSchema = z.toJSONSchema(ResumeSchema, {
  target: 'draft-7',
}) as Record<string, unknown>;

export type ResumeJsonSchema = typeof resumeJsonSchema;

export const RESUME_JSON_SCHEMA_STRING = JSON.stringify(resumeJsonSchema, null, 2);
