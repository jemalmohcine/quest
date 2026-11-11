import { useMemo, useState } from 'react';
import { useQuest } from './QuestProvider';
import {
  GOAL_PACKS,
  getGoalPack,
  goalPackToProfileSettings,
  resolveDisplayedGoalPack,
  type GoalPackId,
} from '@/lib/goal-packs';
import { PILLARS, PILLAR_LABELS, type Pillar } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { UI_CONSTANTS } from '@/constants';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { DurationUnit } from '@/lib/duration-units';

type Props = {
  disabled?: boolean;
  onApplied?: () => void;
};

function formatDuration(value: number, unit: DurationUnit, lang: 'en' | 'fr') {
  if (unit !== 'minutes') return `${value} ${unit}`;
  return lang === 'fr' ? `${value} min` : `${value} min`;
}

export function GoalPacksPanel({ disabled, onApplied }: Props) {
  const { profile, t, updateProfile } = useQuest();
  const lang = profile?.language === 'fr' ? 'fr' : 'en';
  const [pendingId, setPendingId] = useState<GoalPackId | null>(null);
  const [applying, setApplying] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const active = useMemo(() => resolveDisplayedGoalPack(profile), [profile]);

  const activeLabel = useMemo(() => {
    if (!profile) return '';
    if (active === 'custom') return t('goalPackCustom');
    if (active) return getGoalPack(active).copy[lang].name;
    return t('goalPackCustom');
  }, [active, lang, profile, t]);

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
    <div className="space-y-3 border-b border-zinc-100 pb-6 dark:border-zinc-800">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {t('goalPacksTitle')}
        </p>
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{t('goalPacksIntro')}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {t('goalPackActive')}:{' '}
          <span className="text-zinc-800 dark:text-zinc-200">{activeLabel}</span>
        </p>
      </div>

      <div
        role="listbox"
        aria-label={t('goalPacksTitle')}
        className={cn(
          'flex gap-2 overflow-x-auto pb-0.5 md:overflow-visible',
          '[-ms-overflow-style:none] [scrollbar-width:none] md:[scrollbar-width:auto] [&::-webkit-scrollbar]:hidden md:[&::-webkit-scrollbar]:auto',
        )}
      >
        {GOAL_PACKS.map((pack) => {
          const copy = pack.copy[lang];
          const isActive = active === pack.id;
          return (
            <button
              key={pack.id}
              type="button"
              role="option"
              aria-selected={isActive}
              disabled={disabled || applying}
              onClick={() => openPreview(pack.id)}
              className={cn(
                'min-h-11 min-w-[9.5rem] max-w-[11rem] shrink-0 touch-manipulation rounded-xl border px-3 py-2 text-left transition-colors md:min-w-0 md:max-w-none md:flex-1',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400',
                isActive
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-zinc-800',
                UI_CONSTANTS.buttonRadius,
              )}
            >
              <span className="block text-[10px] font-black uppercase tracking-widest">{copy.name}</span>
              <span
                className={cn(
                  'mt-0.5 block line-clamp-2 text-[9px] font-medium leading-snug',
                  isActive ? 'text-white/85' : 'text-zinc-500 dark:text-zinc-400',
                )}
              >
                {copy.tagline}
              </span>
            </button>
          );
        })}
      </div>

      <Dialog open={!!pendingId} onOpenChange={(open) => !open && !applying && setPendingId(null)}>
        <DialogContent
          className={cn(
            'max-w-sm border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:max-w-md',
            UI_CONSTANTS.cardRadius,
          )}
        >
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
              {previewCopy?.name}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t('goalPackOverwriteWarning')}
            </DialogDescription>
            {previewCopy?.summaryWhy && (
              <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{previewCopy.summaryWhy}</p>
            )}
          </DialogHeader>
          {previewPack && (
            <>
              <ul
                className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300"
                aria-label={t('goalPackPreviewTargets')}
              >
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
                className={cn(
                  'min-h-11 w-full justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500',
                  UI_CONSTANTS.buttonRadius,
                )}
              >
                {detailOpen ? t('goalPackHideDetail') : t('goalPackViewDetail')}
                {detailOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {detailOpen && previewCopy && (
                <ul className="max-h-36 space-y-2 overflow-y-auto text-[11px] text-zinc-600 dark:text-zinc-400">
                  {PILLARS.map((p: Pillar) => (
                    <li key={p} className="rounded-xl bg-zinc-50 p-2 dark:bg-zinc-800/50">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{PILLAR_LABELS[lang][p]}</span>
                      <p className="mt-0.5">{previewCopy.pillarWhy[p]}</p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={applying}
              onClick={() => setPendingId(null)}
              className={cn(
                'min-h-11 flex-1 border-zinc-200 text-[10px] font-black uppercase tracking-widest dark:border-zinc-800',
                UI_CONSTANTS.buttonRadius,
              )}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              disabled={applying || !pendingId}
              onClick={() => pendingId && void applyPack(pendingId)}
              className={cn(
                'min-h-11 flex-1 bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-500',
                UI_CONSTANTS.buttonRadius,
              )}
            >
              {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('goalPackApply')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
