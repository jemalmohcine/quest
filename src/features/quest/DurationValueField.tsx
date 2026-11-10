import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { UI_CONSTANTS } from '@/constants';
import type { DurationUnit } from '@/lib/duration-units';
import { DURATION_UNITS } from '@/lib/duration-units';
import { useQuest } from './QuestProvider';
import type { TranslationKey } from '@/lib/translations';

const UNIT_LABEL_KEYS: Record<DurationUnit, TranslationKey> = {
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
};

export function DurationValueField({
  value,
  unit,
  onValueChange,
  onUnitChange,
  id,
  disabled,
  className,
}: Props) {
  const { t } = useQuest();

  return (
    <div className={cn('flex gap-2', className)}>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={unit === 'minutes' ? 1 : 0.25}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onWheel={(e) => (e.target as HTMLInputElement).blur()}
        disabled={disabled}
        className={cn(
          'box-border h-11 min-h-11 max-h-11 min-w-0 flex-1 py-0 leading-none tabular-nums',
          UI_CONSTANTS.buttonRadius,
        )}
      />
      <Select value={unit} onValueChange={(v) => v && onUnitChange(v as DurationUnit)} disabled={disabled}>
        <SelectTrigger
          className={cn(
            'box-border h-11 min-h-11 w-[7.25rem] shrink-0 text-[10px] font-black uppercase tracking-wide',
            UI_CONSTANTS.buttonRadius,
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          {DURATION_UNITS.map((u) => (
            <SelectItem key={u} value={u} className="text-xs font-bold">
              {t(UNIT_LABEL_KEYS[u])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
