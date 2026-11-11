import { addDays, addMonths, differenceInCalendarDays, endOfMonth, format, getWeek, getYear, parseISO, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import type { Pillar } from '@/types';
import { calendarWeekBoundsFromMondayYmd, QUEST_WEEK_OPTS } from '@/lib/calendar-period';

export type ResumePeriodType = 'day' | 'week' | 'month';
export type ResumeScope = 'global' | Pillar;

export const RESUME_MIN_DEEDS_GLOBAL = 3;
export const RESUME_MIN_DEEDS_PILLAR = 1;
export const RESUME_DAY_EARLY_CLOSE_HOUR = 20;

export function ymdInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function hourInTimeZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const h = parts.find((p) => p.type === 'hour')?.value ?? '0';
  return parseInt(h, 10);
}

export function periodStartYmd(type: ResumePeriodType, anchor: Date): string {
  if (type === 'day') return format(anchor, 'yyyy-MM-dd');
  if (type === 'week') return format(startOfWeek(anchor, QUEST_WEEK_OPTS), 'yyyy-MM-dd');
  return format(startOfMonth(anchor), 'yyyy-MM-dd');
}

export function periodBoundsYmd(
  type: ResumePeriodType,
  periodStart: string,
): { from: string; to: string; dayCount: number } {
  const start = parseISO(periodStart);
  if (type === 'day') return { from: periodStart, to: periodStart, dayCount: 1 };
  if (type === 'week') {
    const b = calendarWeekBoundsFromMondayYmd(periodStart);
    return { from: b.startYmd, to: b.endYmd, dayCount: b.dayCount };
  }
  const monthStart = startOfMonth(start);
  const monthEnd = endOfMonth(start);
  const from = format(monthStart, 'yyyy-MM-dd');
  const to = format(monthEnd, 'yyyy-MM-dd');
  const dayCount = differenceInCalendarDays(monthEnd, monthStart) + 1;
  return { from, to, dayCount };
}

/** Period is eligible for generation once it has ended in the user's timezone. */
export function isResumePeriodEnded(
  type: ResumePeriodType,
  periodStart: string,
  now: Date,
  timeZone: string,
  earlyCloseHour = RESUME_DAY_EARLY_CLOSE_HOUR,
): boolean {
  const todayYmd = ymdInTimeZone(now, timeZone);
  const hour = hourInTimeZone(now, timeZone);
  const { from, to } = periodBoundsYmd(type, periodStart);

  if (todayYmd < from) return false;
  if (todayYmd > to) return true;
  return hour >= earlyCloseHour;
}

export function shiftPeriodStart(type: ResumePeriodType, periodStart: string, delta: -1 | 1): string {
  const start = parseISO(periodStart);
  if (type === 'day') return format(addDays(start, delta), 'yyyy-MM-dd');
  if (type === 'week') return format(addDays(start, delta * 7), 'yyyy-MM-dd');
  const next = delta === 1 ? addMonths(startOfMonth(start), 1) : subMonths(startOfMonth(start), 1);
  return format(startOfMonth(next), 'yyyy-MM-dd');
}

export function normalizePeriodStart(type: ResumePeriodType, ymd: string): string {
  if (type === 'month') return format(startOfMonth(parseISO(ymd)), 'yyyy-MM-dd');
  if (type === 'week') return format(startOfWeek(parseISO(ymd), QUEST_WEEK_OPTS), 'yyyy-MM-dd');
  return ymd;
}

export function legacyWeekIdFromMonday(mondayYmd: string): string {
  const d = parseISO(mondayYmd);
  return `${getYear(d)}-W${getWeek(d, QUEST_WEEK_OPTS)}`;
}
