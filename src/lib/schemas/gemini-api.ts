import { z } from 'zod';

export const geminiExtractDeedBodySchema = z.object({
  mimeType: z.string().min(1).max(120),
  audioBase64: z.string().min(1).max(25_000_000),
  language: z.enum(['fr', 'en']),
  feelingChoices: z.array(z.string().max(80)).min(1).max(80),
});

export const geminiWeeklyNarrativeBodySchema = z.object({
  deedsSummary: z.string().min(1).max(50_000),
  userName: z.string().max(200).optional(),
  selectedWeek: z.string().max(32),
  language: z.enum(['fr', 'en']),
});

export const geminiWeeklyTtsBodySchema = z.object({
  narrative: z.string().min(1).max(20_000),
});
