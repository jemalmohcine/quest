import { GoogleGenAI } from '@google/genai';
import { getGeminiServerApiKey } from '@/lib/gemini/server-key';
import { buildPeriodResumePrompt } from '@/lib/gemini/period-resume-prompt';
import type { ResumePeriodType } from '@/lib/resume-periods';
import type { ResumeScope } from '@/lib/resume-periods';

export async function generatePeriodResumeNarrative(opts: {
  userName: string;
  language: 'en' | 'fr';
  periodType: ResumePeriodType;
  periodStart: string;
  periodEnd: string;
  scope: ResumeScope;
  contextBlock: string;
}): Promise<string> {
  const key = getGeminiServerApiKey();
  if (!key) throw new Error('Gemini API Key is not configured.');

  const prompt = buildPeriodResumePrompt(opts);
  const ai = new GoogleGenAI({ apiKey: key });
  const result = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  const text = result.text?.trim();
  if (!text) throw new Error('No response from AI.');
  return text;
}
