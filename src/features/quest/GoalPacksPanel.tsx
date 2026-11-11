import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuest } from './QuestProvider';
import {
  GOAL_PACKS,
  getGoalPack,
  goalPackToProfileSettings,
  resolveDisplayedGoalPack,
  type GoalPackDefinition,
  type GoalPackId,
} from '@/lib/goal-packs';
import { PILLARS, PILLAR_COLORS, PILLAR_LABELS, type Pillar } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn, sumPillarObjectives } from '@/lib/utils';
import { UI_CONSTANTS } from '@/constants';
import { ChevronDown, ChevronUp, Loader2, Package, Sparkles } from 'lucide-react';
import type { DurationUnit } from '@/lib/duration-units';

type Props = {
  disabled?: boolean;
  onApplied?: () => void;
};

function formatDuration(value: number, unit: DurationUnit, lang: 'en' | 'fr') {
  if (unit !== 'minutes') return `${value} ${unit}`;
  return lang === 'fr' ? `${value} min` : `${value} min`;
}

type CompactCardProps = {
  pack: GoalPackDefinition;
  lang: 'en' | 'fr';
  isActive: boolean;
  disabled: boolean;
  applying: boolean;
  onChoose: () => void;
  chooseLabel: string;
  selectedLabel: string;
  className?: string;
  id?: string;
};

function GoalPackCompactCard({
  pack,
  lang,
  isActive,
  disabled,
  applying,
  onChoose,
  chooseLabel,
  selectedLabel,
  className,
  id,
}: CompactCardProps) {
  const copy = pack.copy[lang];
  const totalDeeds = sumPillarObjectives(pack.deedsPerDay);
  return (
    <Card
      id={id}
      className={cn(
        'border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-900/80',
        isActive && 'ring-2 ring-indigo-500 shadow-md shadow-indigo-500/15',
        UI_CONSTANTS.cardRadius,
        className,
      )}
    >
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="min-h-0 flex-1 space-y-1">
          <h4 className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-white">{copy.name}</h4>
          <p className="line-clamp-2 text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">{copy.tagline}</p>
          <p className="text-[10px] font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
            {totalDeeds} {lang === 'fr' ? 'actes/jour au total' : 'deeds/day total'}
          </p>
        </div>
        <Button
          type="button"
          variant={isActive ? 'outline' : 'default'}
          disabled={disabled || applying}
          onClick={onChoose}
          className={cn(
            'min-h-11 w-full text-[10px] font-black uppercase tracking-widest',
            UI_CONSTANTS.buttonRadius,
            !isActive && 'bg-indigo-600 text-white hover:bg-indigo-500',
          )}
        >
          {isActive ? selectedLabel : chooseLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export function GoalPacksPanel({ disabled, onApplied }: Props) {
  const { profile, t, updateProfile } = useQuest();
  const lang = profile?.language === 'fr' ? 'fr' : 'en';
  const [pendingId, setPendingId] = useState<GoalPackId | null>(null);
  const [applying, setApplying] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = useMemo(() => resolveDisplayedGoalPack(profile), [profile]);

  const activeLabel = useMemo(() => {
    if (!profile) return '';
    if (active === 'custom') return t('goalPackCustom');
    if (active) return getGoalPack(active).copy[lang].name;
    return t('goalPackCustom');
  }, [active, lang, profile, t]);

  const syncCarouselIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.children.length === 0) return;
    const first = el.children[0] as HTMLElement;
    const stride = first.offsetWidth + 12;
    if (stride <= 0) return;
    const idx = Math.round(el.scrollLeft / stride);
    setCarouselIndex(Math.max(0, Math.min(GOAL_PACKS.length - 1, idx)));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => syncCarouselIndex();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [syncCarouselIndex]);

  const scrollToPackIndex = (index: number) => {
    const el = scrollRef.current;
    if (!el || index < 0 || index >= GOAL_PACKS.length) return;
    const child = el.children[index] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    setCarouselIndex(index);
  };

  useEffect(() => {
    if (active && active !== 'custom') {
      const i = GOAL_PACKS.findIndex((p) => p.id === active);
      if (i >= 0) setCarouselIndex(i);
    }
  }, [active]);

  const openPreview = (id: GoalPackId) => {
    setDetailOpen(false);
    setPendingId(id);
  };

  const applyPack = async (id: GoalPackId) => {
    setApplying(true);
    try {
      const patch = goalPackToProfileSettings(id);
      await updateProfile(patch);
      onApplied?.();
      setPendingId(null);
      setDetailOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setApplying(false);
    }
  };

  const previewPack = pendingId ? getGoalPack(pendingId) : null;
  const previewCopy = previewPack?.copy[lang];

  return (
    <div className="space-y-3 border-b border-zinc-100 pb-4 dark:border-zinc-800 md:pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <Package className="h-4 w-4 text-indigo-500" aria-hidden />
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('goalPacksTitle')}</p>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {t('goalPackActive')}: {activeLabel}
        </span>
      </div>
      <p className="text-[11px] leading-snug text-zinc-600 dark:text-zinc-400 md:text-xs">{t('goalPacksIntro')}</p>

      {/* Mobile: horizontal snap carousel */}
      <div className="md:hidden">
        <div
          ref={scrollRef}
          role="list"
          aria-label={t('goalPackCarouselLabel')}
          className={cn(
            'flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1',
            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {GOAL_PACKS.map((pack) => {
            const isActive = active === pack.id;
            return (
              <div
                key={pack.id}
                role="listitem"
                className="w-[82vw] max-w-[320px] shrink-0 snap-center scroll-ml-3 first:pl-1 last:pr-1"
              >
                <GoalPackCompactCard
                  id={`goal-pack-card-${pack.id}`}
                  pack={pack}
                  lang={lang}
                  isActive={isActive}
                  disabled={!!disabled}
                  applying={applying}
                  onChoose={() => openPreview(pack.id)}
                  chooseLabel={t('goalPackChoose')}
                  selectedLabel={t('goalPackSelected')}
                  className="min-h-[148px]"
                />
              </div>
            );
          })}
        </div>
        <div
          className="mt-2 flex justify-center gap-2"
          role="tablist"
          aria-label={t('goalPackDotLabel')}
        >
          {GOAL_PACKS.map((pack, index) => (
            <button
              key={pack.id}
              type="button"
              role="tab"
              aria-selected={carouselIndex === index}
              aria-controls={`goal-pack-card-${pack.id}`}
              aria-label={`${pack.copy[lang].name} (${index + 1}/${GOAL_PACKS.length})`}
              onClick={() => scrollToPackIndex(index)}
              className={cn(
                'min-h-11 min-w-11 rounded-full p-2 touch-manipulation transition-colors',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500',
              )}
            >
              <span
                className={cn(
                  'mx-auto block h-2 w-2 rounded-full transition-all',
                  carouselIndex === index ? 'scale-125 bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-600',
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: 3-column grid, compact cards */}
      <div className="hidden gap-4 md:grid md:grid-cols-3">
        {GOAL_PACKS.map((pack) => {
          const isActive = active === pack.id;
          return (
            <GoalPackCompactCard
              key={pack.id}
              pack={pack}
              lang={lang}
              isActive={isActive}
              disabled={!!disabled}
              applying={applying}
              onChoose={() => openPreview(pack.id)}
              chooseLabel={t('goalPackChoose')}
              selectedLabel={t('goalPackSelected')}
            />
          );
        })}
      </div>

      <Dialog open={!!pendingId} onOpenChange={(open) => !open && !applying && setPendingId(null)}>
        <DialogContent className={cn('max-w-md border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900', UI_CONSTANTS.cardRadius)}>
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              {previewCopy?.name}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t('goalPackOverwriteWarning')}
            </DialogDescription>
            {previewCopy?.summaryWhy && (
              <p className="text-xs italic leading-relaxed text-indigo-700/90 dark:text-indigo-300/90">{previewCopy.summaryWhy}</p>
            )}
          </DialogHeader>
          {previewPack && (
            <>
              <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300" aria-label={t('goalPackPreviewTargets')}>
                {PILLARS.map((p) => (
                  <li key={p}>
                    <span className="font-bold">{PILLAR_LABELS[lang][p]}:</span>{' '}
                    {previewPack.deedsPerDay[p]} {lang === 'fr' ? 'actes/jour' : 'deeds/day'}
                    {p !== 'heartset' && previewPack.durationPerDay[p]
                      ? `, ${formatDuration(previewPack.durationPerDay[p]!.value, previewPack.durationPerDay[p]!.unit, lang)}`
                      : ''}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="ghost"
                aria-expanded={detailOpen}
                onClick={() => setDetailOpen((v) => !v)}
                className={cn('min-h-11 w-full justify-between text-[10px] font-black uppercase tracking-widest', UI_CONSTANTS.buttonRadius)}
              >
                {detailOpen ? t('goalPackHideDetail') : t('goalPackViewDetail')}
                {detailOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {detailOpen && previewCopy && (
                <ul className="max-h-40 space-y-2 overflow-y-auto text-[11px] text-zinc-600 dark:text-zinc-400">
                  {PILLARS.map((p: Pillar) => (
                    <li
                      key={p}
                      className="rounded-lg border-l-[3px] bg-zinc-50 p-2 dark:bg-zinc-900/50"
                      style={{ borderColor: PILLAR_COLORS[p] }}
                    >
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{PILLAR_LABELS[lang][p]}</span>
                      <p className="mt-0.5">{previewCopy.pillarWhy[p]}</p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          <DialogFooter className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={applying}
              onClick={() => setPendingId(null)}
              className={cn('min-h-11 flex-1', UI_CONSTANTS.buttonRadius)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              disabled={applying || !pendingId}
              onClick={() => pendingId && void applyPack(pendingId)}
              className={cn('min-h-11 flex-1 bg-indigo-600 text-white hover:bg-indigo-500', UI_CONSTANTS.buttonRadius)}
            >
              {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {t('goalPackApply')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
