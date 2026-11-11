import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

/** Quest week: Monday 00:00 → Sunday 23:59 (local time of `anchor`). */
export const QUEST_WEEK_OPTS = { weekStartsOn: 1 as const };

export type CalendarBounds = {
  start: Date;
  end: Date;
  startYmd: string;
  endYmd: string;
  dayCount: number;
};

export function calendarWeekBounds(anchor = new Date()): CalendarBounds {
  const start = startOfDay(startOfWeek(anchor, QUEST_WEEK_OPTS));
  const end = endOfDay(endOfWeek(anchor, QUEST_WEEK_OPTS));
  return {
    start,
    end,
    startYmd: format(start, 'yyyy-MM-dd'),
    endYmd: format(end, 'yyyy-MM-dd'),
    dayCount: 7,
  };
}

export function calendarMonthBounds(anchor = new Date()): CalendarBounds {
  const start = startOfDay(startOfMonth(anchor));
  const end = endOfDay(endOfMonth(anchor));
  return {
    start,
    end,
    startYmd: format(start, 'yyyy-MM-dd'),
    endYmd: format(end, 'yyyy-MM-dd'),
    dayCount: differenceInCalendarDays(end, start) + 1,
  };
}

export function calendarYearBounds(anchor = new Date()): CalendarBounds {
  const start = startOfDay(startOfYear(anchor));
  const end = endOfDay(endOfYear(anchor));
  return {
    start,
    end,
    startYmd: format(start, 'yyyy-MM-dd'),
    endYmd: format(end, 'yyyy-MM-dd'),
    dayCount: differenceInCalendarDays(end, start) + 1,
  };
}

/** Week bounds from a Monday YYYY-MM-DD (resumes, API). */
export function calendarWeekBoundsFromMondayYmd(periodStartYmd: string): CalendarBounds {
  const start = startOfDay(parseISO(periodStartYmd));
  const end = endOfDay(addDays(start, 6));
  return {
    start,
    end,
    startYmd: periodStartYmd,
    endYmd: format(end, 'yyyy-MM-dd'),
    dayCount: 7,
  };
}

/** Deed `date` (YYYY-MM-DD) falls in the calendar week containing `anchor`. */
export function deedYmdInWeekContaining(ymd: string, anchor = new Date()): boolean {
  const { startYmd, endYmd } = calendarWeekBounds(anchor);
  return ymd >= startYmd && ymd <= endYmd;
}

export function deedYmdInMonthContaining(ymd: string, anchor = new Date()): boolean {
  const { startYmd, endYmd } = calendarMonthBounds(anchor);
  return ymd >= startYmd && ymd <= endYmd;
}
