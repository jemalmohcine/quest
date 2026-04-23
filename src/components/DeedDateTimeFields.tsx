import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker, DayButton, UI, SelectionState, DayFlag, type ClassNames, type DayButtonProps } from 'react-day-picker';
import { format, parseISO, isValid } from 'date-fns';
import type { Locale } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';
import { UI_CONSTANTS } from '@/constants';

const pad2 = (n: number) => String(n).padStart(2, '0');

function deedPickerClassNames(): Partial<ClassNames> {
  return {
    [UI.Root]:
      'rounded-xl p-2 text-zinc-900 [color-scheme:light] dark:text-zinc-50 dark:[color-scheme:dark]',
    [UI.Months]: 'relative flex flex-col gap-3',
    [UI.Month]: 'relative space-y-2',
    [UI.MonthCaption]:
      'relative flex h-10 items-center justify-center px-12 text-center pointer-events-none',
    [UI.CaptionLabel]: 'text-sm font-semibold text-zinc-900 dark:text-zinc-50',
    [UI.Nav]:
      'absolute left-0 right-0 top-0 z-30 flex h-10 items-center justify-between px-0.5 pointer-events-none',
    [UI.PreviousMonthButton]:
      'pointer-events-auto inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-zinc-50 text-zinc-900 shadow-sm hover:bg-zinc-100 active:scale-95 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700',
    [UI.NextMonthButton]:
      'pointer-events-auto inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-zinc-50 text-zinc-900 shadow-sm hover:bg-zinc-100 active:scale-95 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700',
    [UI.MonthGrid]: 'mt-1 w-full border-separate border-spacing-1',
    [UI.Weekdays]: 'flex',
    [UI.Weekday]:
      'flex h-8 w-9 items-center justify-center text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-400',
    [UI.Weeks]: 'mt-1',
    [UI.Week]: 'mt-1 flex w-full gap-0.5',
    [UI.Day]: 'relative flex size-9 items-center justify-center p-0 align-middle',
    [UI.DayButton]:
      'flex size-9 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-sm font-medium text-zinc-800 outline-none transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-zinc-950',
    /** Selection paint lives on {@link DeedDayButton} — <td> ignores border-radius in tables. */
    [SelectionState.selected]: '!bg-transparent p-0 shadow-none',
    [DayFlag.today]: 'font-semibold text-indigo-700 dark:text-indigo-300',
    [DayFlag.outside]: '!text-zinc-400 opacity-100 dark:!text-zinc-600',
    [DayFlag.disabled]: '!text-zinc-300 dark:!text-zinc-600',
    [DayFlag.hidden]: 'invisible',
    [UI.Chevron]: 'size-4 fill-zinc-800 dark:fill-zinc-200',
  };
}

function DeedDayButton(props: DayButtonProps) {
  const { className, modifiers, ...rest } = props;
  return (
    <DayButton
      {...rest}
      modifiers={modifiers}
      className={cn(
        className,
        modifiers.selected &&
          '!rounded-lg !bg-indigo-600 !text-white hover:!bg-indigo-600 hover:!text-white focus-visible:!ring-2 focus-visible:!ring-white focus-visible:!ring-offset-0 dark:!bg-indigo-500 dark:hover:!bg-indigo-500'
      )}
    />
  );
}

function placePopupBelow(el: HTMLElement, approxH: number): { top: number; left: number } {
  const r = el.getBoundingClientRect();
  let top = r.bottom + 8;
  if (top + approxH > window.innerHeight - 8) {
    top = Math.max(8, r.top - approxH - 8);
  }
  let left = r.left;
  const approxW = 320;
  if (left + approxW > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - approxW - 8);
  }
  return { top, left };
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

type DeedDateTimeComboFieldProps = {
  label: string;
  timeSectionLabel: string;
  dateStr: string;
  timeStr: string;
  onDateChange: (yyyyMmDd: string) => void;
  onTimeChange: (hhMm: string) => void;
  locale: Locale;
  applyLabel: string;
};

/**
 * Single control: calendar (with working month navigation) + time columns + Apply.
 */
export function DeedDateTimeComboField({
  label,
  timeSectionLabel,
  dateStr,
  timeStr,
  onDateChange,
  onTimeChange,
  locale,
  applyLabel,
}: DeedDateTimeComboFieldProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [displayMonth, setDisplayMonth] = useState<Date>(() => new Date());
  const [draftDate, setDraftDate] = useState<Date>(() => new Date());
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);

  const syncTime = (v: string) => {
    const [h, m] = v.split(':').map((x) => parseInt(x, 10));
    setHour(Number.isNaN(h) ? 0 : Math.min(23, Math.max(0, h)));
    setMinute(Number.isNaN(m) ? 0 : Math.min(59, Math.max(0, m)));
  };

  useEffect(() => {
    if (!open) return;
    const d = dateStr && isValid(parseISO(dateStr)) ? parseISO(dateStr) : new Date();
    setDraftDate(d);
    setDisplayMonth(d);
    syncTime(timeStr || '00:00');
  }, [open, dateStr, timeStr]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t)) return;
      if (popupRef.current?.contains(t)) return;
      setOpen(false);
      setPos(null);
    };
    const onScroll = (e: Event) => {
      const el = e.target;
      if (el instanceof Node && popupRef.current?.contains(el)) return;
      setOpen(false);
      setPos(null);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const apply = () => {
    onDateChange(format(draftDate, 'yyyy-MM-dd'));
    onTimeChange(`${pad2(hour)}:${pad2(minute)}`);
    setOpen(false);
    setPos(null);
  };

  const summaryLine =
    dateStr && isValid(parseISO(dateStr))
      ? `${format(parseISO(dateStr), 'PPP', { locale })} · ${timeStr || '00:00'}`
      : `${format(new Date(), 'PPP', { locale })} · ${timeStr || '00:00'}`;

  return (
    <div className="min-w-0 space-y-2 sm:col-span-2" ref={anchorRef}>
      <Label className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400">{label}</Label>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          if (open) {
            setOpen(false);
            setPos(null);
            return;
          }
          const wrap = anchorRef.current;
          const btn = wrap?.querySelector('button');
          const el = (btn ?? wrap) as HTMLElement | null | undefined;
          if (el) setPos(placePopupBelow(el, 520));
          setOpen(true);
        }}
        className={cn(
          'h-11 w-full justify-start gap-2 border-zinc-200 px-3 font-normal text-zinc-900 dark:border-zinc-700 dark:text-zinc-100',
          UI_CONSTANTS.buttonRadius
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0 opacity-70" />
        <span className="truncate text-left text-sm font-semibold">{summaryLine}</span>
      </Button>
      {open &&
        pos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popupRef}
            onWheel={(e) => e.stopPropagation()}
            className={cn(
              'fixed z-[9999] flex max-h-[min(92vh,560px)] w-[min(100vw-1rem,340px)] flex-col overflow-hidden overflow-y-auto rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-xl ring-1 ring-zinc-950/5 [color-scheme:light] dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-white/10 dark:[color-scheme:dark]',
              UI_CONSTANTS.cardRadius
            )}
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="p-2">
              <DayPicker
                mode="single"
                month={displayMonth}
                onMonthChange={setDisplayMonth}
                selected={draftDate}
                onSelect={(d) => d && setDraftDate(d)}
                locale={locale}
                classNames={deedPickerClassNames()}
                components={{ DayButton: DeedDayButton }}
              />
            </div>

            <div className="border-t border-zinc-200 px-3 pt-2 dark:border-zinc-700">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{timeSectionLabel}</p>
            </div>
            <div className="flex min-h-0 border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900/50">
              <div className="max-h-40 min-w-[3.5rem] flex-1 overflow-y-auto overscroll-contain border-r border-zinc-200 px-1.5 py-1 dark:border-zinc-700">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHour(h)}
                    className={cn(
                      'my-0.5 flex w-full items-center justify-center border-0 bg-transparent py-2 text-sm font-medium tabular-nums transition-colors',
                      UI_CONSTANTS.buttonRadius,
                      'text-zinc-800 hover:bg-white dark:text-zinc-200 dark:hover:bg-zinc-800/90',
                      hour === h &&
                        'bg-white font-semibold text-indigo-700 shadow-sm dark:bg-zinc-800 dark:text-indigo-200'
                    )}
                  >
                    {pad2(h)}
                  </button>
                ))}
              </div>
              <div className="max-h-40 min-w-[3.5rem] flex-1 overflow-y-auto overscroll-contain px-1.5 py-1">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinute(m)}
                    className={cn(
                      'my-0.5 flex w-full items-center justify-center border-0 bg-transparent py-2 text-sm font-medium tabular-nums transition-colors',
                      UI_CONSTANTS.buttonRadius,
                      'text-zinc-800 hover:bg-white dark:text-zinc-200 dark:hover:bg-zinc-800/90',
                      minute === m &&
                        'bg-white font-semibold text-indigo-700 shadow-sm dark:bg-zinc-800 dark:text-indigo-200'
                    )}
                  >
                    {pad2(m)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-100 px-3 py-3 dark:border-zinc-700 dark:bg-zinc-900">
              <div className="min-w-0 text-xs font-bold leading-tight text-zinc-800 dark:text-zinc-200">
                <div className="truncate">{format(draftDate, 'PP', { locale })}</div>
                <div className="tabular-nums text-indigo-600 dark:text-indigo-400">
                  {pad2(hour)}:{pad2(minute)}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-9 shrink-0 bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-500"
                onClick={apply}
              >
                {applyLabel}
              </Button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
