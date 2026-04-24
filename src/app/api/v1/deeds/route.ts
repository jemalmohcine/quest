import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/require-user';
import { questApi } from '@/services/quest-api';
import { deedCreateSchema } from '@/lib/schemas/deed';
import { deedFieldsFromDateAndTime } from '@/lib/utils';

export async function GET(request: Request) {
  const { supabase, user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const since = searchParams.get('since');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const recent = searchParams.get('recent');
  const limitParam = searchParams.get('limit');

  let result;
  if (date) {
    result = await questApi.listDeedsForDay(supabase, user.id, date);
  } else if (since) {
    result = await questApi.listDeedsSinceDate(supabase, user.id, since);
  } else if (from && to) {
    result = await questApi.listDeedsForDateRange(supabase, user.id, from, to);
  } else if (recent) {
    const limit = Math.min(100, Math.max(1, parseInt(recent, 10) || 4));
    result = await questApi.listRecentDeeds(supabase, user.id, limit);
  } else if (limitParam) {
    const n = Math.min(500, Math.max(1, parseInt(limitParam, 10) || 100));
    result = await questApi.listDeedsLimited(supabase, user.id, n);
  } else {
    result = await questApi.listDeeds(supabase, user.id);
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json({ data: result.data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = deedCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation' }, { status: 400 });
  }

  const { dateStr, timeStr, pillar, actionName, feeling, thought, duration } = parsed.data;
  const [y, mo, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  const [hh, mi] = timeStr.split(':').map((n) => parseInt(n, 10));
  const when = new Date(y, mo - 1, d, hh || 0, mi || 0, 0, 0);
  const meta = deedFieldsFromDateAndTime(dateStr, timeStr);

  const row: Record<string, unknown> = {
    user_id: user.id,
    pillar,
    action_name: actionName.trim(),
    feeling: feeling.toLowerCase(),
    created_at: when.toISOString(),
    ...meta,
  };
  if (thought != null && String(thought).trim()) row.thought = String(thought).trim();
  else row.thought = null;
  if (duration != null && !Number.isNaN(duration)) row.duration = duration;

  const result = await questApi.createDeed(supabase, row);
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json({ data: result.data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { supabase, user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  if (searchParams.get('purge') !== 'all') {
    return NextResponse.json({ error: 'Utiliser ?purge=all' }, { status: 400 });
  }

  const result = await questApi.deleteAllDeeds(supabase, user.id);
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
