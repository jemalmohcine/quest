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
import { Gauge, Play, Square, Timer, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MOBILE_SHELL, UI_CONSTANTS } from '@/constants';

function formatChrono(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function FloatingQuestWidget() {
  const { profile, user, t } = useQuest();
  const lang = profile?.language ?? 'en';
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const deedsGeneration = useDeedsRefreshStore((s) => s.generation);
  const [progressPercent, setProgressPercent] = useState(0);
  const running = useChronometerStore((s) => s.running);
  const elapsedMs = useChronometerStore((s) => s.elapsedMs);
  const actionName = useChronometerStore((s) => s.actionName);
  const pillar = useChronometerStore((s) => s.pillar);
  const start = useChronometerStore((s) => s.start);
  const stop = useChronometerStore((s) => s.stop);
  const tick = useChronometerStore((s) => s.tick);
  const setActionName = useChronometerStore((s) => s.setActionName);
  const setPillar = useChronometerStore((s) => s.setPillar);
  const reset = useChronometerStore((s) => s.reset);

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
    if (!running) return;
    const id = setInterval(() => tick(), 250);
    return () => clearInterval(id);
  }, [running, tick]);

  const displayElapsed = useMemo(() => formatChrono(elapsedMs), [elapsedMs]);

  const finishToDeed = async () => {
    if (!user || !actionName.trim()) {
      setMessage(t('actionNameRequired'));
      return;
    }
    const minutes = running ? stop() : Math.max(1, Math.round(elapsedMs / 60000));
    const meta = createDeedMetadata();
    const p = pillar ?? 'skillset';
    const payload = {
      pillar: p,
      actionName: actionName.trim(),
      feeling: 'focused',
      dateStr: meta.date,
      timeStr: meta.time,
      ...(p !== 'heartset' && minutes > 0 ? { duration: minutes } : {}),
    };
    const { error } = await questHttp.createDeed(payload);
    if (error) {
      setMessage(t('saveDeedFailed'));
      return;
    }
    useDeedsRefreshStore.getState().bumpDeedsRefresh();
    setMessage(t('chronoDeedSaved'));
    reset();
    setExpanded(false);
  };

  const goalMessage =
    progressPercent >= 100 ? t('dailyGoalCompleteTitle') : progressPercent >= 75 ? t('widgetAlmostThere') : null;

  return (
    <div
      className={cn(
        'fixed left-[max(1rem,env(safe-area-inset-left,0px))] z-[38] flex max-w-[calc(100vw-5.5rem)] flex-col items-start gap-2',
        MOBILE_SHELL.widgetBottom,
        'md:left-auto md:right-4 md:bottom-6 md:max-w-none md:items-end',
      )}
    >
      {expanded && (
        <div
          className={cn(
            'w-[min(20rem,calc(100vw-5.5rem))] max-h-[min(70dvh,calc(100dvh-12rem))] overflow-y-auto overscroll-y-contain border border-zinc-200 bg-white p-4 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900',
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

          {(goalMessage || message) && (
            <p className="mb-3 rounded-xl bg-indigo-500/10 px-3 py-2 text-xs font-bold leading-snug text-indigo-700 dark:text-indigo-300">
              {message ?? goalMessage}
            </p>
          )}

          <p className="mb-4 text-center font-mono text-3xl font-black tabular-nums text-zinc-900 dark:text-white">
            {displayElapsed}
          </p>

          <div className="space-y-3">
            <Input
              value={actionName}
              onChange={(e) => setActionName(e.target.value)}
              placeholder={t('whatAccomplished')}
              className={cn('h-12 min-h-11 text-base font-bold sm:text-sm', UI_CONSTANTS.buttonRadius)}
            />
            <Select value={pillar ?? 'skillset'} onValueChange={(v) => v && setPillar(v as Pillar)}>
              <SelectTrigger className={cn('h-12 min-h-11 font-bold', UI_CONSTANTS.buttonRadius)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PILLARS.map((p) => (
                  <SelectItem key={p} value={p} className="min-h-11">
                    {PILLAR_LABELS[lang][p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-2 sm:flex-row">
              {!running ? (
                <Button
                  type="button"
                  onClick={() => start(actionName, pillar)}
                  className={cn(
                    'min-h-12 w-full flex-1 touch-manipulation bg-indigo-600 font-bold uppercase text-[10px] tracking-widest sm:w-auto',
                    UI_CONSTANTS.buttonRadius,
                  )}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {t('startTimer')}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => stop()}
                  className={cn(
                    'min-h-12 w-full flex-1 touch-manipulation font-bold uppercase text-[10px] tracking-widest sm:w-auto',
                    UI_CONSTANTS.buttonRadius,
                  )}
                >
                  <Square className="mr-2 h-4 w-4" />
                  {t('stopTimer')}
                </Button>
              )}
              <Button
                type="button"
                onClick={() => void finishToDeed()}
                className={cn(
                  'min-h-12 w-full flex-1 touch-manipulation bg-zinc-900 font-bold uppercase text-[10px] tracking-widest dark:bg-white dark:text-zinc-900 sm:w-auto',
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
          setMessage(null);
        }}
        className={cn(
          'flex h-[3.25rem] w-[3.25rem] min-h-11 min-w-11 touch-manipulation flex-col items-center justify-center rounded-full border border-indigo-500/30 bg-white shadow-xl shadow-indigo-500/20 transition active:scale-95 dark:bg-zinc-900',
          running && 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950',
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
