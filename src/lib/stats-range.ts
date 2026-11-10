import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  subDays,
} from 'date-fns';
import type { StatsRange } from '@/lib/objectives';

export type StatsPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';

const WEEK_OPTS = { weekStartsOn: 1 as const };

export function rangeForPeriod(period: StatsPeriod, now = new Date(), custom?: { from: string; to: string }): StatsRange {
  if (period === 'custom' && custom?.from && custom?.to) {
    const startYmd = custom.from;
    const endYmd = custom.to >= custom.from ? custom.to : custom.from;
    return {
      start: startOfDay(new Date(startYmd + 'T12:00:00')),
      end: endOfDay(new Date(endYmd + 'T12:00:00')),
      startYmd,
      endYmd,
      dayCount: Math.max(
        1,
        Math.round(
          (endOfDay(new Date(endYmd + 'T12:00:00')).getTime() -
            startOfDay(new Date(startYmd + 'T12:00:00')).getTime()) /
            86400000,
        ) + 1,
      ),
    };
  }

  switch (period) {
    case 'day': {
      const ymd = format(now, 'yyyy-MM-dd');
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        startYmd: ymd,
        endYmd: ymd,
        dayCount: 1,
      };
    }
    case 'week': {
      const start = startOfWeek(now, WEEK_OPTS);
      const end = endOfDay(now);
      return {
        start,
        end,
        startYmd: format(start, 'yyyy-MM-dd'),
        endYmd: format(end, 'yyyy-MM-dd'),
        dayCount: Math.max(1, Math.round((end.getTime() - startOfDay(start).getTime()) / 86400000) + 1),
      };
    }
    case 'month': {
      const start = startOfMonth(now);
      const end = endOfDay(now);
      return {
        start,
        end,
        startYmd: format(start, 'yyyy-MM-dd'),
        endYmd: format(end, 'yyyy-MM-dd'),
        dayCount: Math.max(1, Math.round((end.getTime() - startOfDay(start).getTime()) / 86400000) + 1),
      };
    }
    case 'year': {
      const start = startOfYear(now);
      const end = endOfDay(now);
      return {
        start,
        end,
        startYmd: format(start, 'yyyy-MM-dd'),
        endYmd: format(end, 'yyyy-MM-dd'),
        dayCount: Math.max(1, Math.round((end.getTime() - startOfDay(start).getTime()) / 86400000) + 1),
      };
    }
    default:
      return rangeForPeriod('week', now);
  }
}

/** Rolling last N days ending today (used for month chart buckets when period is month). */
export function lastNDaysRange(days: number, now = new Date()): StatsRange {
  const end = endOfDay(now);
  const start = startOfDay(subDays(now, days - 1));
  return {
    start,
    end,
    startYmd: format(start, 'yyyy-MM-dd'),
    endYmd: format(end, 'yyyy-MM-dd'),
    dayCount: days,
  };
}
