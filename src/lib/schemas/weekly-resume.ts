import { z } from 'zod';

export const weeklyResumePutSchema = z.object({
  narrative: z.string(),
  audio_base64: z.string().nullable().optional(),
});

export type WeeklyResumePutBody = z.infer<typeof weeklyResumePutSchema>;
