import { z } from 'zod';
import { PILLARS } from '@/types';

const scopeSchema = z.enum(['global', ...PILLARS] as [string, ...string[]]);
const periodTypeSchema = z.enum(['day', 'week', 'month']);

export const resumeGetQuerySchema = z.object({
  period_type: periodTypeSchema,
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scope: scopeSchema,
});

export const resumeGenerateBodySchema = z.object({
  period_type: periodTypeSchema,
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scope: scopeSchema,
  timeZone: z.string().min(1).max(80),
});

export type ResumeGenerateBody = z.infer<typeof resumeGenerateBodySchema>;
