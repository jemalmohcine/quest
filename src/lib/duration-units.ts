import type { TranslationKey } from '@/lib/translations';

export type DurationUnit = 'seconds' | 'minutes' | 'hours' | 'days' | 'months';

/** Units available when logging a deed (includes seconds). */
export const DURATION_UNITS_DEED: DurationUnit[] = ['seconds', 'minutes', 'hours', 'days', 'months'];

/** Units for per-pillar daily time goals (same as before). */
export const DURATION_UNITS_GOAL: DurationUnit[] = ['minutes', 'hours', 'days', 'months'];

/** @deprecated Prefer DURATION_UNITS_GOAL or DURATION_UNITS_DEED. */
export const DURATION_UNITS = DURATION_UNITS_GOAL;

export const DEED_DURATION_UNIT_VALUES = DURATION_UNITS_DEED as readonly DurationUnit[];

const SECONDS_PER: Record<DurationUnit, number> = {
  seconds: 1,
  minutes: 60,
  hours: 60 * 60,
  days: 24 * 60 * 60,
  months: 30 * 24 * 60 * 60,
};

export function durationToSeconds(value: number, unit: DurationUnit): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * SECONDS_PER[unit]);
}

export function durationToMinutes(value: number, unit: DurationUnit): number {
  return Math.round(durationToSeconds(value, unit) / 60);
}

export function secondsToValueInUnit(seconds: number, unit: DurationUnit): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  const raw = seconds / SECONDS_PER[unit];
  if (unit === 'seconds' || unit === 'minutes') return Math.round(raw);
  return Math.round(raw * 10) / 10;
}

export function minutesToDurationUnit(minutes: number, unit: DurationUnit): number {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  return secondsToValueInUnit(minutes * 60, unit);
}

export function parseDurationToSeconds(value: string, unit: DurationUnit): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed);
  if (Number.isNaN(n) || n < 0) return null;
  const sec = durationToSeconds(n, unit);
  return sec > 0 ? sec : null;
}

/** Returns rounded minutes — prefer parseDurationToSeconds for deeds. */
export function parseDurationInput(value: string, unit: DurationUnit): number | null {
  const sec = parseDurationToSeconds(value, unit);
  if (sec == null) return null;
  return Math.max(0, Math.round(sec / 60));
}

export function formatMinutesForDisplay(minutes: number, unit: DurationUnit): string {
  if (minutes <= 0) return '';
  return String(minutesToDurationUnit(minutes, unit));
}

export function formatSecondsForUnitInput(seconds: number, unit: DurationUnit): string {
  if (seconds <= 0) return '';
  return String(secondsToValueInUnit(seconds, unit));
}

export type DeedDurationLike = {
  duration?: number | null;
  durationSeconds?: number | null;
  durationUnit?: DurationUnit | string | null;
};

export function getDeedDurationSeconds(deed: DeedDurationLike): number {
  if (deed.durationSeconds != null && deed.durationSeconds > 0) return deed.durationSeconds;
  if (deed.duration != null && deed.duration > 0) return deed.duration * 60;
  return 0;
}

export function getDeedDurationMinutes(deed: DeedDurationLike): number {
  return Math.round(getDeedDurationSeconds(deed) / 60);
}

export function deedDurationFormState(deed: DeedDurationLike): { value: string; unit: DurationUnit } {
  const seconds = getDeedDurationSeconds(deed);
  const unit = (deed.durationUnit as DurationUnit) || 'minutes';
  const safeUnit = DURATION_UNITS_DEED.includes(unit) ? unit : 'minutes';
  if (seconds <= 0) return { value: '', unit: 'minutes' };
  return { value: formatSecondsForUnitInput(seconds, safeUnit), unit: safeUnit };
}

export type DeedDurationFields = {
  duration_seconds: number;
  duration_unit: DurationUnit;
  /** Legacy rounded minutes for backward compatibility. */
  duration: number;
};

export function deedDurationFieldsFromInput(
  value: string,
  unit: DurationUnit | null | undefined,
): { ok: true; fields: DeedDurationFields } | { ok: false; code: 'empty' } | { ok: false; code: 'missing_unit' | 'invalid' } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, code: 'empty' };
  if (!unit || !DURATION_UNITS_DEED.includes(unit)) return { ok: false, code: 'missing_unit' };
  const sec = parseDurationToSeconds(trimmed, unit);
  if (sec == null) return { ok: false, code: 'invalid' };
  return {
    ok: true,
    fields: {
      duration_seconds: sec,
      duration_unit: unit,
      duration: Math.max(0, Math.round(sec / 60)),
    },
  };
}

const UNIT_PHRASE_KEYS_PLURAL: Record<DurationUnit, TranslationKey> = {
  seconds: 'durationPhraseSeconds',
  minutes: 'durationPhraseMinutes',
  hours: 'durationPhraseHours',
  days: 'durationPhraseDays',
  months: 'durationPhraseMonths',
};

const UNIT_PHRASE_KEYS_SINGULAR: Record<DurationUnit, TranslationKey> = {
  seconds: 'durationPhraseSecond',
  minutes: 'durationPhraseMinute',
  hours: 'durationPhraseHour',
  days: 'durationPhraseDay',
  months: 'durationPhraseMonth',
};

export function formatDeedDurationPhrase(
  deed: DeedDurationLike,
  t: (key: TranslationKey) => string,
): string {
  const seconds = getDeedDurationSeconds(deed);
  if (seconds <= 0) return '';
  const unit = (deed.durationUnit as DurationUnit) || 'minutes';
  const safeUnit = DURATION_UNITS_DEED.includes(unit) ? unit : 'minutes';
  const value = secondsToValueInUnit(seconds, safeUnit);
  const unitKey = value === 1 ? UNIT_PHRASE_KEYS_SINGULAR[safeUnit] : UNIT_PHRASE_KEYS_PLURAL[safeUnit];
  return `${value} ${t(unitKey)}`;
}
