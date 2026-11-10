import type { DurationUnit } from '@/lib/duration-units';
import { formatDeedDurationPhrase } from '@/lib/duration-units';
import type { TranslationKey } from '@/lib/translations';

/** Pick duration_unit for timer-logged deeds from elapsed seconds. */
export function chronoDurationFields(totalSec: number): {
  durationSeconds: number;
  durationUnit: DurationUnit;
} {
  const sec = Math.max(1, Math.round(totalSec));
  if (sec < 60) return { durationSeconds: sec, durationUnit: 'seconds' };
  if (sec < 3600) return { durationSeconds: sec, durationUnit: 'minutes' };
  return { durationSeconds: sec, durationUnit: 'hours' };
}

export function formatChronoLoggedDuration(
  totalSec: number,
  t: (key: TranslationKey) => string,
): string {
  const { durationSeconds, durationUnit } = chronoDurationFields(totalSec);
  return formatDeedDurationPhrase({ durationSeconds, durationUnit }, t);
}
