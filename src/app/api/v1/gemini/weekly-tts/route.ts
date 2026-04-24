import { NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';
import { requireUser } from '@/lib/api/require-user';
import { getGeminiServerApiKey } from '@/lib/gemini/server-key';
import { geminiWeeklyTtsBodySchema } from '@/lib/schemas/gemini-api';

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

  const parsed = geminiWeeklyTtsBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation' }, { status: 400 });
  }

  const { narrative } = parsed.data;
  const prompt = `Read this weekly summary with an inspiring and calm tone. Summary: ${narrative}`;

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return NextResponse.json({ error: 'No audio data received from Gemini' }, { status: 502 });
    }
    return NextResponse.json({ audioBase64: base64Audio });
  } catch (e) {
    console.error('[gemini/weekly-tts]', e);
    const msg = e instanceof Error ? e.message : 'Gemini error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
