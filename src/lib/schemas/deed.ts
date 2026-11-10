import { z } from 'zod';

export const pillarSchema = z.enum(['soulset', 'healthset', 'mindset', 'skillset', 'heartset']);

const deedDurationUnitSchema = z.enum(['seconds', 'minutes', 'hours', 'days', 'months']);

const maxDurationSeconds = 366 * 24 * 60 * 60;

export const deedCreateSchema = z
  .object({
    pillar: pillarSchema,
    actionName: z.string().trim().min(1, 'Nom requis').max(500),
    feeling: z.string().trim().min(1).max(80),
    thought: z.string().trim().max(5000).optional().nullable(),
    /** Canonical duration in seconds. */
    durationSeconds: z.number().int().min(1).max(maxDurationSeconds).optional().nullable(),
    durationUnit: deedDurationUnitSchema.optional().nullable(),
    /** Legacy minutes-only payload (still accepted). */
    duration: z.number().int().min(0).max(86400).optional().nullable(),
    dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    timeStr: z.string().regex(/^\d{1,2}:\d{2}$/),
  })
  .superRefine((data, ctx) => {
    if (data.pillar === 'heartset' && (data.durationSeconds || data.duration)) {
      ctx.addIssue({ code: 'custom', message: 'Heartset has no duration', path: ['durationSeconds'] });
    }
    const hasValue =
      (data.durationSeconds != null && data.durationSeconds > 0) || (data.duration != null && data.duration > 0);
    if (hasValue && data.pillar !== 'heartset') {
      if (data.durationSeconds != null && data.durationSeconds > 0 && !data.durationUnit) {
        ctx.addIssue({ code: 'custom', message: 'Duration unit is required', path: ['durationUnit'] });
      }
    }
  });

export type DeedCreateInput = z.infer<typeof deedCreateSchema>;

/** PATCH /api/v1/deeds/[id] — champs SQL autorisés uniquement. */
export const deedPatchApiSchema = z
  .object({
    action_name: z.string().trim().min(1).max(500).optional(),
    pillar: pillarSchema.optional(),
    feeling: z.string().trim().min(1).max(80).optional(),
    thought: z.string().max(5000).nullable().optional(),
    duration: z.number().int().min(0).nullable().optional(),
    duration_seconds: z.number().int().min(0).max(maxDurationSeconds).nullable().optional(),
    duration_unit: deedDurationUnitSchema.nullable().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    week: z.number().int().optional(),
    month: z.string().max(16).optional(),
    year: z.number().int().optional(),
    time: z.string().max(16).optional(),
    created_at: z.string().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.duration_seconds != null && data.duration_seconds > 0 && !data.duration_unit) {
      ctx.addIssue({ code: 'custom', message: 'Duration unit is required', path: ['duration_unit'] });
    }
  });

export type DeedPatchBody = z.infer<typeof deedPatchApiSchema>;
