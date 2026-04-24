import { z } from 'zod';

export const pillarSchema = z.enum(['soulset', 'healthset', 'mindset', 'skillset', 'heartset']);

export const deedCreateSchema = z.object({
  pillar: pillarSchema,
  actionName: z.string().trim().min(1, 'Nom requis').max(500),
  feeling: z.string().trim().min(1).max(80),
  thought: z.string().trim().max(5000).optional().nullable(),
  duration: z.number().int().min(0).max(86400).optional().nullable(),
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeStr: z.string().regex(/^\d{1,2}:\d{2}$/),
});

export type DeedCreateInput = z.infer<typeof deedCreateSchema>;

export const deedUpdateSchema = deedCreateSchema.partial().extend({
  id: z.string().uuid(),
});

/** PATCH /api/v1/deeds/[id] — champs SQL autorisés uniquement. */
export const deedPatchApiSchema = z
  .object({
    action_name: z.string().trim().min(1).max(500).optional(),
    pillar: pillarSchema.optional(),
    feeling: z.string().trim().min(1).max(80).optional(),
    thought: z.string().max(5000).nullable().optional(),
    duration: z.number().int().min(0).nullable().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    week: z.number().int().optional(),
    month: z.string().max(16).optional(),
    year: z.number().int().optional(),
    time: z.string().max(16).optional(),
    created_at: z.string().optional(),
  })
  .strict();

export type DeedPatchBody = z.infer<typeof deedPatchApiSchema>;
