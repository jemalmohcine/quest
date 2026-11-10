import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { UI_CONSTANTS } from '@/constants';
import type { DurationUnit } from '@/lib/duration-units';
import { DURATION_UNITS_DEED } from '@/lib/duration-units';
import { useQuest } from './QuestProvider';
import type { TranslationKey } from '@/lib/translations';

const UNIT_LABEL_KEYS: Record<DurationUnit, TranslationKey> = {
  seconds: 'durationUnitSeconds',
  minutes: 'durationUnitMinutes',
  hours: 'durationUnitHours',
  days: 'durationUnitDays',
  months: 'durationUnitMonths',
};

type Props = {
  value: string;
  unit: DurationUnit;
  onValueChange: (v: string) => void;
  onUnitChange: (u: DurationUnit) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  /** Defaults to deed units (includes seconds). */
  units?: DurationUnit[];
  error?: string | null;
};

export function DurationValueField({
  value,
  unit,
  onValueChange,
  onUnitChange,
  id,
  disabled,
  className,
  units = DURATION_UNITS_DEED,
  error,
}: Props) {
  const { t } = useQuest();

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={unit === 'seconds' || unit === 'minutes' ? 1 : 0.25}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id ?? 'duration'}-error` : undefined}
          className={cn(
            'box-border h-12 min-h-11 max-h-12 min-w-0 w-full flex-1 py-0 text-base leading-none tabular-nums sm:h-11 sm:max-h-11 sm:text-sm',
            UI_CONSTANTS.buttonRadius,
            error && 'border-red-500 ring-1 ring-red-500/30',
          )}
        />
        <Select value={unit} onValueChange={(v) => v && onUnitChange(v as DurationUnit)} disabled={disabled}>
          <SelectTrigger
            className={cn(
              'box-border h-12 min-h-11 w-full shrink-0 text-xs font-black uppercase tracking-wide sm:h-11 sm:w-[7.5rem]',
              UI_CONSTANTS.buttonRadius,
              error && 'border-red-500',
            )}
          >
            <SelectValue placeholder={t('durationUnitPick')} />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            {units.map((u) => (
              <SelectItem key={u} value={u} className="text-xs font-bold">
                {t(UNIT_LABEL_KEYS[u])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error ? (
        <p id={`${id ?? 'duration'}-error`} className="text-[11px] font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
