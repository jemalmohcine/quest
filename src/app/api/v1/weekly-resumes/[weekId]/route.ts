import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/require-user';
import { questApi } from '@/services/quest-api';
import { weeklyResumePutSchema } from '@/lib/schemas/weekly-resume';

type RouteContext = { params: Promise<{ weekId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { supabase, user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { weekId } = await context.params;
  if (!weekId) {
    return NextResponse.json({ error: 'weekId requis' }, { status: 400 });
  }

  const result = await questApi.getWeeklyResume(supabase, user.id, weekId);
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json({ data: result.data });
}

export async function PUT(request: Request, context: RouteContext) {
  const { supabase, user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { weekId } = await context.params;
  if (!weekId) {
    return NextResponse.json({ error: 'weekId requis' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = weeklyResumePutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation' }, { status: 400 });
  }

  const payload = {
    user_id: user.id,
    week_id: weekId,
    narrative: parsed.data.narrative,
    audio_base64: parsed.data.audio_base64 ?? null,
  };

  const result = await questApi.upsertWeeklyResume(supabase, payload);
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
