import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/require-user';
import { questApi } from '@/services/quest-api';
import { resumeGetQuerySchema } from '@/lib/schemas/resume';
import {
  legacyWeekIdFromMonday,
  normalizePeriodStart,
  type ResumePeriodType,
} from '@/lib/resume-periods';

export async function GET(request: Request) {
  const { supabase, user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const parsed = resumeGetQuerySchema.safeParse({
    period_type: searchParams.get('period_type'),
    period_start: searchParams.get('period_start'),
    scope: searchParams.get('scope'),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation' }, { status: 400 });
  }

  const periodType = parsed.data.period_type as ResumePeriodType;
  const periodStart = normalizePeriodStart(periodType, parsed.data.period_start);
  const scope = parsed.data.scope;

  let result = await questApi.getResume(supabase, user.id, periodType, periodStart, scope);
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  if (!result.data && periodType === 'week' && scope === 'global') {
    const legacyId = legacyWeekIdFromMonday(periodStart);
    const legacy = await questApi.getWeeklyResume(supabase, user.id, legacyId);
    if (!legacy.error && legacy.data) {
      return NextResponse.json({ data: { ...legacy.data, period_type: 'week', period_start: periodStart, scope: 'global' } });
    }
    const legacyByStart = await questApi.getWeeklyResume(supabase, user.id, periodStart);
    if (!legacyByStart.error && legacyByStart.data) {
      return NextResponse.json({
        data: { ...legacyByStart.data, period_type: 'week', period_start: periodStart, scope: 'global' },
      });
    }
  }

  return NextResponse.json({ data: result.data ?? null });
}
