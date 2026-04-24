import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/require-user';
import { questApi } from '@/services/quest-api';
import { profileUpsertBodySchema } from '@/lib/schemas/profile';

export async function GET() {
  const { supabase, user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const result = await questApi.getProfile(supabase, user.id);
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json({ data: result.data });
}

export async function PUT(request: Request) {
  const { supabase, user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = profileUpsertBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation' }, { status: 400 });
  }

  const row = {
    id: user.id,
    email: user.email ?? '',
    ...parsed.data,
  };

  const result = await questApi.upsertProfile(supabase, row);
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
