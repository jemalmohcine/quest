import {
  differenceInCalendarDays,
  eachDayOfInterval,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';
import type { Deed, DurationObjective, Pillar, UserProfile } from '@/types';
import { PILLARS } from '@/types';
import { durationToMinutes } from '@/lib/duration-units';
import { effectiveDeedsTowardDaily, dailyTargetFromProfile, pillarDailyTarget } from '@/lib/utils';

export type StatsRange = {
  start: Date;
  end: Date;
  /** Inclusive YYYY-MM-DD */
  startYmd: string;
  endYmd: string;
  dayCount: number;
};

export function statsRangeFromYmd(startYmd: string, endYmd: string): StatsRange {
  const start = startOfDay(parseISO(startYmd));
  const end = endOfDay(parseISO(endYmd));
  const dayCount = Math.max(1, differenceInCalendarDays(end, start) + 1);
  return { start, end, startYmd, endYmd, dayCount };
}

export function periodDeedTarget(profile: UserProfile | null | undefined, pillar: Pillar, dayCount: number): number {
  const perDay = pillarDailyTarget(profile, pillar);
  if (perDay <= 0) return 0;
  return perDay * dayCount;
}

export function dailyDurationObjectiveMinutes(
  profile: UserProfile | null | undefined,
  pillar: Pillar,
): number {
  const obj = profile?.durationObjectivePerPillar?.[pillar];
  if (!obj || obj.value <= 0) return 0;
  return durationToMinutes(obj.value, obj.unit);
}

export function periodDurationTargetMinutes(
  profile: UserProfile | null | undefined,
  pillar: Pillar,
  dayCount: number,
): number {
  const perDay = dailyDurationObjectiveMinutes(profile, pillar);
  if (perDay <= 0) return 0;
  return perDay * dayCount;
}

export function deedsOnDay(deeds: Deed[], ymd: string): Deed[] {
  return deeds.filter((d) => d.date === ymd);
}

export function isDailyObjectivesMet(
  profile: UserProfile | null | undefined,
  dayDeeds: Deed[],
): boolean {
  if (!profile) return false;
  const target = dailyTargetFromProfile(profile);
  if (target <= 0) return false;
  const effective = effectiveDeedsTowardDaily(profile, dayDeeds);
  return effective >= target;
}

export function isPillarDeedsMetForPeriod(
  profile: UserProfile | null | undefined,
  pillar: Pillar,
  count: number,
  dayCount: number,
): boolean {
  const target = periodDeedTarget(profile, pillar, dayCount);
  if (target <= 0) return false;
  return count >= target;
}

export function isPillarDurationMetForPeriod(
  profile: UserProfile | null | undefined,
  pillar: Pillar,
  totalMinutes: number,
  dayCount: number,
): boolean {
  const target = periodDurationTargetMinutes(profile, pillar, dayCount);
  if (target <= 0) return false;
  return totalMinutes >= target;
}

export function deedsInRange(deeds: Deed[], range: StatsRange): Deed[] {
  return deeds.filter((d) => d.date >= range.startYmd && d.date <= range.endYmd);
}

export function eachDayInRange(range: StatsRange): Date[] {
  return eachDayOfInterval({ start: range.start, end: range.end });
}

export function defaultDurationObjectives(): Partial<Record<Pillar, DurationObjective>> {
  return {};
}

export function normalizeDurationObjective(
  raw: unknown,
): DurationObjective | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as { value?: unknown; unit?: unknown };
  const value = Number(o.value);
  const unit = o.unit;
  if (Number.isNaN(value) || value < 0) return undefined;
  if (unit !== 'minutes' && unit !== 'hours' && unit !== 'days' && unit !== 'months') return undefined;
  return { value: Math.min(9999, value), unit };
}

export function parseDurationObjectivesFromDb(
  json: Record<string, unknown> | null | undefined,
): Partial<Record<Pillar, DurationObjective>> {
  const out: Partial<Record<Pillar, DurationObjective>> = {};
  if (!json) return out;
  for (const p of PILLARS) {
    const normalized = normalizeDurationObjective(json[p]);
    if (normalized) out[p] = normalized;
  }
  return out;
}
