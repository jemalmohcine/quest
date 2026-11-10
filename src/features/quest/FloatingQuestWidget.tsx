'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuest } from './QuestProvider';
import { useChronometerStore } from '@/stores/chronometer-store';
import { questHttp } from '@/services/quest-http';
import { createDeedMetadata } from '@/lib/utils';
import { PILLARS, PILLAR_LABELS, type Pillar } from '@/types';
import { useDeedsRefreshStore } from '@/stores';
import { cn, dailyProgressBreakdown } from '@/lib/utils';
import { mapDeedRows } from '@/lib/quest-mappers';
import { format } from 'date-fns';
import { Gauge, Pause, Play, Square, Timer, X, Plus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MOBILE_SHELL, UI_CONSTANTS } from '@/constants';
import { allFeelingOptions } from '@/lib/feelings';
import { chronoDurationFields, formatChronoLoggedDuration } from '@/lib/chrono-duration';

function formatChrono(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function FloatingQuestWidget() {
  const { profile, user, t } = useQuest();
  const lang = profile?.language ?? 'en';
  const [expanded, setExpanded] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const deedsGeneration = useDeedsRefreshStore((s) => s.generation);
  const [progressPercent, setProgressPercent] = useState(0);

  const hydrateFromStorage = useChronometerStore((s) => s.hydrateFromStorage);
  const tickSeq = useChronometerStore((s) => s.tickSeq);
  const hasSession = useChronometerStore((s) => s.hasSession);
  const paused = useChronometerStore((s) => s.paused);
  const actionName = useChronometerStore((s) => s.actionName);
  const pillar = useChronometerStore((s) => s.pillar);
  const feeling = useChronometerStore((s) => s.feeling);
  const start = useChronometerStore((s) => s.start);
  const pause = useChronometerStore((s) => s.pause);
  const resume = useChronometerStore((s) => s.resume);
  const reset = useChronometerStore((s) => s.reset);
  const setActionName = useChronometerStore((s) => s.setActionName);
  const setPillar = useChronometerStore((s) => s.setPillar);
  const setFeeling = useChronometerStore((s) => s.setFeeling);
  const getElapsedMs = useChronometerStore((s) => s.getElapsedMs);
  const bumpUiTick = useChronometerStore((s) => s.bumpUiTick);

  const feelingOptions = useMemo(() => allFeelingOptions(profile), [profile]);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    void questHttp.listDeeds({ date: today }).then(({ data }) => {
      const deeds = mapDeedRows(data);
      const { percent } = dailyProgressBreakdown(profile, deeds);
      setProgressPercent(percent);
    });
  }, [user, profile, deedsGeneration]);

  useEffect(() => {
    if (!hasSession || paused) return;
    const id = setInterval(() => bumpUiTick(), 250);
    const onVis = () => bumpUiTick();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [hasSession, paused, bumpUiTick]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [toast]);

  const elapsedMs = useMemo(() => {
    void tickSeq;
    return getElapsedMs();
  }, [tickSeq, getElapsedMs, paused, hasSession]);

  const displayElapsed = useMemo(() => formatChrono(elapsedMs), [elapsedMs]);
  const sessionActive = hasSession;
  const fieldsLocked = sessionActive;

  const logDeedFromTimer = async (opts?: { keepExpanded?: boolean }) => {
    setInlineError(null);
    if (!user || !actionName.trim()) {
      setInlineError(t('actionNameRequired'));
      return;
    }
    if (!pillar) {
      setInlineError(t('pillarRequired'));
      return;
    }
    const totalSec = Math.max(0, Math.round(elapsedMs / 1000));
    const meta = createDeedMetadata();
    const p = pillar;
    const durationPart =
      p !== 'heartset' && totalSec > 0
        ? (() => {
            const { durationSeconds, durationUnit } = chronoDurationFields(totalSec);
            return { durationSeconds, durationUnit };
          })()
        : {};

    const payload = {
      pillar: p,
      actionName: actionName.trim(),
      feeling: (feeling || 'happy').toLowerCase(),
      dateStr: meta.date,
      timeStr: meta.time,
      ...durationPart,
    };

    const { error } = await questHttp.createDeed(payload);
    if (error) {
      setInlineError(t('saveDeedFailed'));
      return;
    }

    useDeedsRefreshStore.getState().bumpDeedsRefresh();
    const durPhrase =
      p === 'heartset' || totalSec <= 0
        ? null
        : formatChronoLoggedDuration(totalSec, t);
    setToast(durPhrase ? `${t('chronoToastLogged')} · ${durPhrase}` : t('chronoToastLogged'));
    reset();
    if (!opts?.keepExpanded) setExpanded(false);
  };

  const finishAndLog = () => void logDeedFromTimer();

  const handleStart = () => {
    setInlineError(null);
    if (!actionName.trim()) {
      setInlineError(t('actionNameRequired'));
      return;
    }
    if (!pillar) {
      setInlineError(t('pillarRequired'));
      return;
    }
    const ok = start();
    if (!ok) setInlineError(t('timerAlreadyRunning'));
  };

  const goalMessage =
    progressPercent >= 100 ? t('dailyGoalCompleteTitle') : progressPercent >= 75 ? t('widgetAlmostThere') : null;

  return (
    <div
      className={cn(
        'fixed z-[38] flex min-w-0 flex-col items-stretch gap-2',
        'left-[max(0.75rem,env(safe-area-inset-left,0px))]',
        'w-[min(20rem,calc(100vw-3.5rem-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px)))]',
        'max-w-[calc(100vw-3.5rem)]',
        MOBILE_SHELL.widgetBottom,
        'md:left-auto md:right-4 md:bottom-6 md:w-[20rem] md:max-w-none md:items-end',
      )}
      data-timer-version="2"
    >
      {toast && (
        <div
          role="status"
          className={cn(
            'box-border flex w-full min-w-0 items-center gap-2 border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 shadow-lg dark:bg-emerald-950/90 dark:text-emerald-100',
            UI_CONSTANTS.cardRadius,
          )}
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
          <span className="leading-snug">{toast}</span>
        </div>
      )}

      {expanded && (
        <div
          className={cn(
            'box-border w-full min-w-0 max-h-[min(70dvh,calc(100dvh-12rem))] overflow-x-hidden overflow-y-auto overscroll-y-contain border border-zinc-200 bg-white p-4 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900',
            UI_CONSTANTS.cardRadius,
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Timer className="h-4 w-4 shrink-0 text-indigo-600" />
              <span className="truncate text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('chronometer')}</span>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label={t('cancel')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {(goalMessage || inlineError) && (
            <p
              className={cn(
                'mb-3 rounded-xl px-3 py-2 text-xs font-bold leading-snug',
                inlineError
                  ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                  : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
              )}
            >
              {inlineError ?? goalMessage}
            </p>
          )}

          <p
            className={cn(
              'mb-4 text-center font-mono text-3xl font-black tabular-nums text-zinc-900 dark:text-white',
              paused && 'text-amber-600 dark:text-amber-400',
            )}
          >
            {displayElapsed}
            {paused && (
              <span className="mt-1 block text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                {t('timerPaused')}
              </span>
            )}
          </p>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('actionName')}</Label>
              <Input
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
                placeholder={t('whatAccomplished')}
                disabled={fieldsLocked}
                className={cn('h-12 min-h-11 text-base font-bold sm:text-sm', UI_CONSTANTS.buttonRadius)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('pillar')}</Label>
              <Select
                value={pillar ?? 'soulset'}
                onValueChange={(v) => v && setPillar(v as Pillar)}
                disabled={fieldsLocked}
              >
                <SelectTrigger className={cn('h-12 min-h-11 w-full min-w-0 font-bold', UI_CONSTANTS.buttonRadius)}>
                  <SelectValue placeholder={t('pillar')} />
                </SelectTrigger>
                <SelectContent>
                  {PILLARS.map((p) => (
                    <SelectItem key={p} value={p} className="min-h-11">
                      {PILLAR_LABELS[lang][p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('feeling')}</Label>
              <Select value={feeling} onValueChange={(v) => v && setFeeling(v)} disabled={fieldsLocked}>
                <SelectTrigger className={cn('h-12 min-h-11 w-full min-w-0 font-bold capitalize', UI_CONSTANTS.buttonRadius)}>
                  <SelectValue placeholder={t('feeling')} />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {feelingOptions.map((f) => (
                    <SelectItem key={f} value={f} className="min-h-11 capitalize">
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              {!sessionActive ? (
                <Button
                  type="button"
                  onClick={handleStart}
                  className={cn(
                    'min-h-12 w-full touch-manipulation bg-indigo-600 font-bold uppercase text-[10px] tracking-widest',
                    UI_CONSTANTS.buttonRadius,
                  )}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {t('startTimer')}
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {paused ? (
                    <Button
                      type="button"
                      onClick={() => resume()}
                      className={cn(
                        'min-h-12 w-full touch-manipulation bg-indigo-600 font-bold uppercase text-[10px] tracking-widest',
                        UI_CONSTANTS.buttonRadius,
                      )}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {t('resumeTimer')}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => pause()}
                      className={cn(
                        'min-h-12 w-full touch-manipulation font-bold uppercase text-[10px] tracking-widest',
                        UI_CONSTANTS.buttonRadius,
                      )}
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      {t('pauseTimer')}
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={finishAndLog}
                    className={cn(
                      'min-h-12 w-full touch-manipulation bg-zinc-900 font-bold uppercase text-[10px] tracking-widest dark:bg-white dark:text-zinc-900',
                      UI_CONSTANTS.buttonRadius,
                    )}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    {t('finishAndLog')}
                  </Button>
                </div>
              )}

              <Button
                type="button"
                variant="secondary"
                onClick={() => void logDeedFromTimer({ keepExpanded: false })}
                disabled={!sessionActive}
                className={cn(
                  'min-h-12 w-full touch-manipulation font-bold uppercase text-[10px] tracking-widest',
                  UI_CONSTANTS.buttonRadius,
                )}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('logWithDuration')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setExpanded((e) => !e);
          setInlineError(null);
        }}
        className={cn(
          'flex h-[3.25rem] w-[3.25rem] min-h-11 min-w-11 touch-manipulation flex-col items-center justify-center rounded-full border border-indigo-500/30 bg-white shadow-xl shadow-indigo-500/20 transition active:scale-95 dark:bg-zinc-900',
          sessionActive && !paused && 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950',
          paused && 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950',
        )}
        aria-expanded={expanded}
        aria-label={t('progressWidget')}
      >
        <Gauge className="h-5 w-5 text-indigo-600" />
        <span className="text-[9px] font-black tabular-nums text-indigo-600">{progressPercent}%</span>
      </button>
    </div>
  );
}
