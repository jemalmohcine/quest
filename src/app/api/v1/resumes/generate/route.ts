import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/require-user';
import { questApi } from '@/services/quest-api';
import { resumeGenerateBodySchema } from '@/lib/schemas/resume';
import { mapDeedRows, profileRowToUserProfile } from '@/lib/quest-mappers';
import {
  isResumePeriodEnded,
  normalizePeriodStart,
  periodBoundsYmd,
  RESUME_MIN_DEEDS_GLOBAL,
  RESUME_MIN_DEEDS_PILLAR,
  type ResumePeriodType,
  type ResumeScope,
} from '@/lib/resume-periods';
import { aggregateDeedsForResume, buildResumeContextForAi } from '@/lib/resume-aggregation';
import { generatePeriodResumeNarrative } from '@/lib/server/generate-period-resume';
import { translations } from '@/lib/translations';
import type { TranslationKey } from '@/lib/translations';
import type { Pillar } from '@/types';
import { PILLARS } from '@/types';

export async function POST(request: Request) {
  const { supabase, user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const profileRow = await questApi.getProfile(supabase, user.id);
  const profile =
    profileRow.data && !profileRow.error ? profileRowToUserProfile(profileRow.data as never) : null;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = resumeGenerateBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation' }, { status: 400 });
  }

  const periodType = parsed.data.period_type as ResumePeriodType;
  const periodStart = normalizePeriodStart(periodType, parsed.data.period_start);
  const scope = parsed.data.scope as ResumeScope;
  const timeZone = parsed.data.timeZone;

  if (scope !== 'global' && !PILLARS.includes(scope as Pillar)) {
    return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
  }

  const existing = await questApi.getResume(supabase, user.id, periodType, periodStart, scope);
  if (existing.error) {
    return NextResponse.json({ error: existing.error.message }, { status: 500 });
  }
  if (existing.data?.narrative) {
    return NextResponse.json({ error: 'Resume already finalized' }, { status: 409 });
  }

  if (!isResumePeriodEnded(periodType, periodStart, new Date(), timeZone)) {
    return NextResponse.json({ error: 'Period not ended yet' }, { status: 400 });
  }

  const { from, to, dayCount } = periodBoundsYmd(periodType, periodStart);
  const deedsRes = await questApi.listDeedsForDateRange(supabase, user.id, from, to);
  if (deedsRes.error) {
    return NextResponse.json({ error: deedsRes.error.message }, { status: 500 });
  }
  const deeds = mapDeedRows(deedsRes.data ?? []);

  const agg = aggregateDeedsForResume(deeds, scope, dayCount, profile ?? undefined);
  const minDeeds = scope === 'global' ? RESUME_MIN_DEEDS_GLOBAL : RESUME_MIN_DEEDS_PILLAR;
  if (agg.deedCount < minDeeds) {
    return NextResponse.json({ error: 'Not enough deeds in this period' }, { status: 400 });
  }

  if (scope !== 'global' && agg.deedCount === 0) {
    return NextResponse.json({ error: 'No deeds for this pillar in the period' }, { status: 400 });
  }

  const lang = profile?.language === 'fr' ? 'fr' : 'en';
  const t = (key: TranslationKey) => translations[lang][key] || translations.en[key] || key;

  const contextBlock = buildResumeContextForAi(agg, profile ?? undefined, scope, dayCount, t);

  try {
    const narrative = await generatePeriodResumeNarrative({
      userName: profile?.name?.trim() || 'Quest',
      language: lang,
      periodType,
      periodStart,
      periodEnd: to,
      scope,
      contextBlock,
    });

    const insert = await questApi.insertResume(supabase, {
      user_id: user.id,
      period_type: periodType,
      period_start: periodStart,
      scope,
      narrative,
    });
    if (insert.error) {
      if (insert.error.code === '23505') {
        return NextResponse.json({ error: 'Resume already finalized' }, { status: 409 });
      }
      return NextResponse.json({ error: insert.error.message }, { status: 500 });
    }

    return NextResponse.json({ data: insert.data }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Generation failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
