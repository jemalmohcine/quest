export type DurationUnit = 'minutes' | 'hours' | 'days' | 'months';

export const DURATION_UNITS: DurationUnit[] = ['minutes', 'hours', 'days', 'months'];

const MINUTES_PER: Record<DurationUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 24 * 60,
  months: 30 * 24 * 60,
};

export function durationToMinutes(value: number, unit: DurationUnit): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * MINUTES_PER[unit]);
}

export function minutesToDurationUnit(minutes: number, unit: DurationUnit): number {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  const raw = minutes / MINUTES_PER[unit];
  return unit === 'minutes' ? Math.round(raw) : Math.round(raw * 10) / 10;
}

export function parseDurationInput(value: string, unit: DurationUnit): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed);
  if (Number.isNaN(n) || n < 0) return null;
  return durationToMinutes(n, unit);
}

export function formatMinutesForDisplay(minutes: number, unit: DurationUnit): string {
  if (minutes <= 0) return '';
  const v = minutesToDurationUnit(minutes, unit);
  return String(v);
}
