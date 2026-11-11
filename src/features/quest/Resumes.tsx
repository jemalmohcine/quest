import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuest } from './QuestProvider';
import { questHttp } from '@/services/quest-http';
import { mapDeedRows } from '@/lib/quest-mappers';
import { aggregateDeedsForResume } from '@/lib/resume-aggregation';
import {
  isResumePeriodEnded,
  normalizePeriodStart,
  periodBoundsYmd,
  periodStartYmd,
  RESUME_MIN_DEEDS_GLOBAL,
  RESUME_MIN_DEEDS_PILLAR,
  shiftPeriodStart,
  type ResumePeriodType,
  type ResumeScope,
} from '@/lib/resume-periods';
import { Deed, PILLAR_COLORS, PILLAR_LABELS, PILLARS, type Pillar } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { addDays, format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, FileText, Loader2, Share2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { UI_CONSTANTS } from '@/constants';
import { SectionHeader } from './SectionHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeedsRefreshStore } from '@/stores';
import type { TranslationKey } from '@/lib/translations';

function userTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

const PERIOD_TYPES: ResumePeriodType[] = ['day', 'week', 'month'];

function periodTypeLabel(t: (k: TranslationKey) => string, type: ResumePeriodType) {
  if (type === 'day') return t('resumePeriodDay');
  if (type === 'week') return t('resumePeriodWeek');
  return t('resumePeriodMonth');
}

function waitMessage(t: (k: TranslationKey) => string, type: ResumePeriodType) {
  if (type === 'day') return t('resumeWaitDayEnd');
  if (type === 'month') return t('resumeWaitMonthEnd');
  return t('resumeWaitWeekEnd');
}

function formatPeriodLabel(type: ResumePeriodType, periodStart: string, _lang: string) {
  const start = parseISO(periodStart);
  if (type === 'day') return format(start, 'PPP');
  if (type === 'week') {
    const end = addDays(start, 6);
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }
  return format(start, 'MMMM yyyy');
}

export function Resumes() {
  const { user, profile, t } = useQuest();
  const deedsGeneration = useDeedsRefreshStore((s) => s.generation);
  const lang = profile?.language === 'fr' ? 'fr' : 'en';
  const timeZone = userTimeZone();

  const [periodType, setPeriodType] = useState<ResumePeriodType>('week');
  const [periodStart, setPeriodStart] = useState(() =>
    periodStartYmd('week', new Date()),
  );
  const [scope, setScope] = useState<ResumeScope>('global');

  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [narrative, setNarrative] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [hasFinalized, setHasFinalized] = useState(false);

  const normalizedStart = useMemo(
    () => normalizePeriodStart(periodType, periodStart),
    [periodType, periodStart],
  );

  const { from, to, dayCount } = useMemo(
    () => periodBoundsYmd(periodType, normalizedStart),
    [periodType, normalizedStart],
  );

  const aggregation = useMemo(
    () => aggregateDeedsForResume(deeds, scope, dayCount, profile ?? undefined),
    [deeds, scope, dayCount, profile],
  );

  const periodEnded = useMemo(
    () => isResumePeriodEnded(periodType, normalizedStart, new Date(), timeZone),
    [periodType, normalizedStart, timeZone],
  );

  const minDeeds = scope === 'global' ? RESUME_MIN_DEEDS_GLOBAL : RESUME_MIN_DEEDS_PILLAR;
  const deedCount = aggregation.deedCount;
  const canGenerate =
    !hasFinalized && periodEnded && deedCount >= minDeeds && !isGenerating;

  const uiLocked = isGenerating;

  const pillarHasThoughts = useCallback(
    (p: Pillar) => aggregation.pillarsWithThoughts.includes(p),
    [aggregation.pillarsWithThoughts],
  );

  const pillarDeedCount = useCallback(
    (p: Pillar) => deeds.filter((d) => d.pillar === p).length,
    [deeds],
  );

  const onPeriodTypeChange = (next: ResumePeriodType) => {
    setPeriodType(next);
    setPeriodStart(periodStartYmd(next, parseISO(normalizedStart)));
    setError(null);
  };

  const shiftPeriod = (delta: -1 | 1) => {
    setPeriodStart(shiftPeriodStart(periodType, normalizedStart, delta));
    setError(null);
  };

  const loadResume = useCallback(async () => {
    const { data, error: rErr } = await questHttp.getResume({
      period_type: periodType,
      period_start: normalizedStart,
      scope,
    });
    if (rErr) {
      console.error(rErr);
      return;
    }
    const row = data as { narrative?: string } | null;
    const nar = row?.narrative?.trim() ?? '';
    setNarrative(nar);
    setHasFinalized(!!nar);
  }, [periodType, normalizedStart, scope]);

  const loadDeeds = useCallback(async () => {
    const { data, error: dErr } = await questHttp.listDeeds({ from, to });
    if (dErr) {
      setError(t('saveDeedFailed'));
      return;
    }
    setDeeds(mapDeedRows(data));
  }, [from, to, t]);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    void Promise.all([loadResume(), loadDeeds()]).finally(() => setIsLoading(false));
  }, [user, loadResume, loadDeeds, deedsGeneration]);

  const generateResume = async () => {
    if (!user || !canGenerate) return;
    setIsGenerating(true);
    setError(null);
    try {
      const { data, error: gErr } = await questHttp.generateResume({
        period_type: periodType,
        period_start: normalizedStart,
        scope,
        timeZone,
      });
      if (gErr) {
        const msg = gErr.message;
        if (msg.includes('not ended') || msg.includes('Period')) {
          setError(t('resumePeriodNotEnded'));
        } else if (msg.includes('deeds') || msg.includes('Not enough')) {
          setError(scope === 'global' ? t('resumeMinDeeds') : t('resumeMinDeedsPillar'));
        } else if (msg.includes('409') || msg.includes('finalized') || msg.includes('already')) {
          setError(t('resumeFinalized'));
          setHasFinalized(true);
        } else {
          setError(t('resumeGenerateFailed'));
        }
        return;
      }
      const row = data as { narrative?: string } | null;
      const nar = row?.narrative?.trim() ?? '';
      if (!nar) throw new Error('empty');
      setNarrative(nar);
      setHasFinalized(true);
    } catch (e) {
      console.error(e);
      setError(t('resumeGenerateFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!narrative) return;
    void navigator.clipboard.writeText(narrative);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const scopeChips: { id: ResumeScope; label: string; color?: string }[] = [
    { id: 'global', label: t('resumeScopeGlobal') },
    ...PILLARS.map((p) => ({
      id: p as ResumeScope,
      label: PILLAR_LABELS[lang]?.[p] ?? p,
      color: PILLAR_COLORS[p],
    })),
  ];

  const emptyDeedsForScope = scope !== 'global' && deedCount === 0;

  return (
    <div
      className={cn(
        'quest-page space-y-5',
        uiLocked && 'pointer-events-none opacity-90',
      )}
      aria-busy={isGenerating}
    >
      <header className="flex flex-col gap-4">
        <SectionHeader title={t('resumes')} subtitle={t('analyzeJourney')} />

        <div
          className={cn(
            'flex p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 gap-1',
            UI_CONSTANTS.buttonRadius,
          )}
          role="tablist"
        >
          {PERIOD_TYPES.map((pt) => (
            <button
              key={pt}
              type="button"
              role="tab"
              aria-selected={periodType === pt}
              disabled={uiLocked}
              onClick={() => onPeriodTypeChange(pt)}
              className={cn(
                'flex-1 min-h-11 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors',
                periodType === pt
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200',
              )}
            >
              {periodTypeLabel(t, pt)}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={uiLocked}
            className={cn('h-11 w-11 shrink-0', UI_CONSTANTS.buttonRadius)}
            onClick={() => shiftPeriod(-1)}
            aria-label="Previous period"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <p className="text-center text-xs font-bold text-zinc-700 dark:text-zinc-300 flex-1 px-2">
            {formatPeriodLabel(periodType, normalizedStart, lang)}
          </p>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={uiLocked}
            className={cn('h-11 w-11 shrink-0', UI_CONSTANTS.buttonRadius)}
            onClick={() => shiftPeriod(1)}
            aria-label="Next period"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {scopeChips.map((chip) => {
            const isPillar = chip.id !== 'global';
            const p = isPillar ? (chip.id as Pillar) : null;
            const hasThoughts = p ? pillarHasThoughts(p) : false;
            const noDeeds = p ? pillarDeedCount(p) === 0 : false;
            const selected = scope === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                disabled={uiLocked}
                onClick={() => {
                  setScope(chip.id);
                  setError(null);
                }}
                className={cn(
                  'min-h-11 px-4 text-[10px] font-black uppercase tracking-widest border transition-all',
                  UI_CONSTANTS.buttonRadius,
                  selected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400',
                  isPillar && hasThoughts && !selected && 'ring-1 ring-indigo-500/30',
                  isPillar && noDeeds && 'opacity-60',
                )}
                style={
                  selected && chip.color
                    ? { backgroundColor: chip.color, borderColor: chip.color }
                    : undefined
                }
              >
                {chip.label}
                {isPillar && hasThoughts ? ' ✦' : ''}
              </button>
            );
          })}
        </div>
      </header>

      <section className="space-y-4">
        {hasFinalized && (
          <div
            className={cn(
              'p-4 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold',
              UI_CONSTANTS.cardRadius,
            )}
          >
            {t('resumeFinalized')} {t('resumeIrreversible')}
          </div>
        )}

        {!hasFinalized && !periodEnded && deedCount > 0 && (
          <div
            className={cn(
              'p-4 bg-indigo-500/5 border border-indigo-500/10 text-indigo-800 dark:text-indigo-200 text-xs font-medium',
              UI_CONSTANTS.cardRadius,
            )}
          >
            {waitMessage(t, periodType)}
          </div>
        )}

        {!hasFinalized && periodEnded && deedCount > 0 && deedCount < minDeeds && (
          <div
            className={cn(
              'p-4 bg-indigo-500/5 border border-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-medium',
              UI_CONSTANTS.cardRadius,
            )}
          >
            {scope === 'global' ? t('resumeMinDeeds') : t('resumeMinDeedsPillar')}
          </div>
        )}

        {!hasFinalized && emptyDeedsForScope && (
          <div
            className={cn(
              'p-4 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-600 text-xs font-medium',
              UI_CONSTANTS.cardRadius,
            )}
          >
            {t('resumePillarNoDeeds')}
          </div>
        )}

        {!hasFinalized && periodEnded && canGenerate && (
          <div
            className={cn(
              'p-4 bg-indigo-500/5 border border-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs italic',
              UI_CONSTANTS.cardRadius,
            )}
          >
            {t('resumeOnePerPeriod')}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            {t('resumeNarrativeTitle')}
          </h2>
          {hasFinalized ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {t('resumeAlreadyGenerated')}
            </span>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => void generateResume()}
              disabled={!canGenerate || uiLocked}
              className={cn(
                'min-h-11 px-5 text-[10px] font-black uppercase tracking-widest',
                UI_CONSTANTS.buttonRadius,
              )}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? t('resumeGenerating') : t('generate')}
            </Button>
          )}
        </div>

        {error && (
          <div
            className={cn(
              'p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-3',
              UI_CONSTANTS.cardRadius,
            )}
          >
            <span className="text-center">{error}</span>
            {!hasFinalized && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isGenerating}
                className="min-h-11"
                onClick={() => void generateResume()}
              >
                {t('resumeRetry')}
              </Button>
            )}
          </div>
        )}

        {isLoading ? (
          <Card className={cn('bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800', UI_CONSTANTS.cardRadius)}>
            <CardContent className="p-8 space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
              <Skeleton className="h-6 w-4/6" />
            </CardContent>
          </Card>
        ) : deeds.length === 0 ? (
          <Card className={cn('bg-zinc-50 dark:bg-zinc-900 border-dashed border-zinc-200 dark:border-zinc-800', UI_CONSTANTS.cardRadius)}>
            <CardContent className="p-12 text-center">
              <FileText className="w-10 h-10 text-zinc-400 mx-auto mb-4" />
              <p className="text-zinc-500 font-bold italic text-sm">{t('noDeedsWeekly')}</p>
            </CardContent>
          </Card>
        ) : narrative ? (
          <Card className={cn('bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl', UI_CONSTANTS.cardRadius)}>
            <CardContent className="p-6 md:p-10 space-y-6">
              <div className="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 leading-relaxed">
                <ReactMarkdown>{narrative}</ReactMarkdown>
              </div>
              <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  disabled={uiLocked}
                  className={cn('min-h-11 font-bold text-[10px] uppercase', UI_CONSTANTS.buttonRadius)}
                >
                  {isCopied ? 'Copied!' : t('copy')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={uiLocked}
                  className={cn('min-h-11 font-bold text-[10px] uppercase', UI_CONSTANTS.buttonRadius)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {t('share')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className={cn('bg-zinc-50 dark:bg-zinc-900 border-dashed border-zinc-200 dark:border-zinc-800', UI_CONSTANTS.cardRadius)}>
            <CardContent className="p-12 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-indigo-500 mx-auto" />
              <p className="text-zinc-500 font-bold italic text-sm">
                {!periodEnded
                  ? waitMessage(t, periodType)
                  : emptyDeedsForScope
                    ? t('resumePillarNoDeeds')
                    : deedCount < minDeeds
                      ? scope === 'global'
                        ? t('resumeMinDeeds')
                        : t('resumeMinDeedsPillar')
                      : t('clickGenerate')}
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
