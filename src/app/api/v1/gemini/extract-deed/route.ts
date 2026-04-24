import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { requireUser } from '@/lib/api/require-user';
import { getGeminiServerApiKey } from '@/lib/gemini/server-key';
import { buildAudioExtractPrompt } from '@/lib/gemini/audio-extract-prompt';
import { geminiExtractDeedBodySchema } from '@/lib/schemas/gemini-api';
import { PILLARS } from '@/types';

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

  const parsed = geminiExtractDeedBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation' }, { status: 400 });
  }

  const { mimeType, audioBase64, language, feelingChoices } = parsed.data;
  const prompt = buildAudioExtractPrompt(language, feelingChoices);

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [{ text: prompt }, { inlineData: { mimeType, data: audioBase64 } }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pillar: { type: Type.STRING, enum: [...PILLARS] },
            actionName: { type: Type.STRING },
            duration: { type: Type.NUMBER, nullable: true },
            feeling: { type: Type.STRING, enum: feelingChoices, nullable: true },
            thought: { type: Type.STRING, nullable: true },
          },
          required: ['pillar', 'actionName'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json({ error: 'No response from AI.' }, { status: 502 });
    }

    const data = JSON.parse(text) as Record<string, unknown>;
    return NextResponse.json({ data });
  } catch (e) {
    console.error('[gemini/extract-deed]', e);
    const msg = e instanceof Error ? e.message : 'Gemini error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
