import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { requireUser } from '@/lib/api/require-user';
import { getGeminiServerApiKey } from '@/lib/gemini/server-key';
import { geminiWeeklyNarrativeBodySchema } from '@/lib/schemas/gemini-api';

export async function POST(request: Request) {
  const { errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const key = getGeminiServerApiKey();
  if (!key) {
    return NextResponse.json(
      { error: 'Gemini API Key is not configured. Set GEMINI_API_KEY or GEMINI_API_KEY_NEW on the server.' },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = geminiWeeklyNarrativeBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation' }, { status: 400 });
  }

  const { deedsSummary, userName, selectedWeek, language } = parsed.data;
  const name = userName?.trim() || 'User';

  const prompt = `
        Summarize the deeds performed by ${name} during the week of ${selectedWeek}.
        
        Keep it EXTREMELY CONCISE (maximum 25 words).
        Structure:
        1. One very short sentence on activity.
        2. One short sentence on highlight.
        3. A 3-word motivational closure.
        
        Data:
        ${deedsSummary}
        
        Language: ${language === 'fr' ? 'French' : 'English'}
        Tone: Inspiring but minimal.
      `;

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const text = result.text;
    if (!text) {
      return NextResponse.json({ error: 'No response from AI.' }, { status: 502 });
    }
    return NextResponse.json({ text });
  } catch (e) {
    console.error('[gemini/weekly-narrative]', e);
    const msg = e instanceof Error ? e.message : 'Gemini error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
