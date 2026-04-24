import { z } from 'zod';

export const objectivePerPillarSchema = z.object({
  soulset: z.number().int().min(0).max(99),
  healthset: z.number().int().min(0).max(99),
  mindset: z.number().int().min(0).max(99),
  skillset: z.number().int().min(0).max(99),
  heartset: z.number().int().min(0).max(99),
});

export const profilePatchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  language: z.enum(['en', 'fr']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  dailyObjective: z.number().int().min(1).max(500).optional(),
  objectivePerPillar: objectivePerPillarSchema.optional(),
  customFeelings: z.array(z.string().trim().max(40)).max(50).optional(),
  photoURL: z.string().max(3_000_000).optional().nullable(),
});

export type ProfilePatchInput = z.infer<typeof profilePatchSchema>;

/** Corps PUT /api/v1/profile (snake_case DB, id/email imposés par la session). */
export const profileUpsertBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  language: z.enum(['en', 'fr']),
  theme: z.enum(['light', 'dark', 'system']),
  daily_objective: z.number().int().min(1).max(1000),
  objective_per_pillar: objectivePerPillarSchema,
  custom_feelings: z.array(z.string().max(80)).max(50),
  photo_url: z.string().nullable().optional(),
});

export type ProfileUpsertBody = z.infer<typeof profileUpsertBodySchema>;
