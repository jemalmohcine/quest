import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import type { StatsRange } from '@/lib/objectives';
import {
  calendarMonthBounds,
  calendarWeekBounds,
  calendarYearBounds,
  type CalendarBounds,
} from '@/lib/calendar-period';

export type StatsPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';

function toStatsRange(b: CalendarBounds): StatsRange {
  return {
    start: b.start,
    end: b.end,
    startYmd: b.startYmd,
    endYmd: b.endYmd,
    dayCount: b.dayCount,
  };
}

export function rangeForPeriod(
  period: StatsPeriod,
  now = new Date(),
  custom?: { from: string; to: string },
): StatsRange {
  if (period === 'custom' && custom?.from && custom?.to) {
    const startYmd = custom.from;
    const endYmd = custom.to >= custom.from ? custom.to : custom.from;
    const start = startOfDay(new Date(`${startYmd}T12:00:00`));
    const end = endOfDay(new Date(`${endYmd}T12:00:00`));
  return {
      start,
      end,
      startYmd,
      endYmd,
      dayCount: Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / 86400000) + 1,
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
    case 'week':
      return toStatsRange(calendarWeekBounds(now));
    case 'month':
      return toStatsRange(calendarMonthBounds(now));
    case 'year':
      return toStatsRange(calendarYearBounds(now));
    default:
      return toStatsRange(calendarWeekBounds(now));
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
