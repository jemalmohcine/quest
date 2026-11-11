import { useMemo, useState } from 'react';
import { useQuest } from './QuestProvider';
import {
  GOAL_PACKS,
  getGoalPack,
  goalPackToProfileSettings,
  resolveDisplayedGoalPack,
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
import { cn } from '@/lib/utils';
import { UI_CONSTANTS } from '@/constants';
import { Loader2, Package, Sparkles } from 'lucide-react';
import type { DurationUnit } from '@/lib/duration-units';

type Props = {
  disabled?: boolean;
  onApplied?: () => void;
};

function formatDuration(value: number, unit: DurationUnit, lang: 'en' | 'fr') {
  if (unit !== 'minutes') {
    return lang === 'fr' ? `${value} ${unit}` : `${value} ${unit}`;
  }
  return lang === 'fr' ? `${value} min` : `${value} min`;
}

export function GoalPacksPanel({ disabled, onApplied }: Props) {
  const { profile, t, updateProfile } = useQuest();
  const lang = profile?.language === 'fr' ? 'fr' : 'en';
  const [pendingId, setPendingId] = useState<GoalPackId | null>(null);
  const [applying, setApplying] = useState(false);

  const active = useMemo(() => resolveDisplayedGoalPack(profile), [profile]);

  const activeLabel = useMemo(() => {
    if (!profile) return '';
    if (active === 'custom') return t('goalPackCustom');
    if (active) return getGoalPack(active).copy[lang].name;
    return t('goalPackCustom');
  }, [active, lang, profile, t]);

  const applyPack = async (id: GoalPackId) => {
    setApplying(true);
    try {
      const patch = goalPackToProfileSettings(id);
      await updateProfile(patch);
      onApplied?.();
      setPendingId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setApplying(false);
    }
  };

  const previewPack = pendingId ? getGoalPack(pendingId) : null;
  const previewCopy = previewPack?.copy[lang];

  return (
    <div className="space-y-5 border-b border-zinc-100 pb-8 dark:border-zinc-800">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Package className="h-4 w-4 text-indigo-500" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('goalPacksTitle')}</p>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {t('goalPackActive')}: {activeLabel}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{t('goalPacksIntro')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {GOAL_PACKS.map((pack) => {
          const copy = pack.copy[lang];
          const isActive = active === pack.id;
          return (
            <Card
              key={pack.id}
              className={cn(
                'border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/60',
                isActive && 'ring-2 ring-indigo-500/40',
                UI_CONSTANTS.cardRadius,
              )}
            >
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-white">{copy.name}</h4>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{copy.tagline}</p>
                  </div>
                  <Button
                    type="button"
                    variant={isActive ? 'outline' : 'default'}
                    disabled={disabled || applying}
                    onClick={() => setPendingId(pack.id)}
                    className={cn(
                      'min-h-11 w-full shrink-0 text-[10px] font-black uppercase tracking-widest sm:w-auto',
                      UI_CONSTANTS.buttonRadius,
                      !isActive && 'bg-indigo-600 text-white hover:bg-indigo-500',
                    )}
                  >
                    {isActive ? t('goalPackSelected') : t('goalPackChoose')}
                  </Button>
                </div>
                <p className="text-[11px] italic leading-relaxed text-indigo-700/90 dark:text-indigo-300/90">{copy.summaryWhy}</p>
                <ul className="space-y-2">
                  {PILLARS.map((p: Pillar) => (
                    <li
                      key={p}
                      className="rounded-xl bg-white/80 p-3 dark:bg-zinc-950/50"
                      style={{ borderLeft: `3px solid ${PILLAR_COLORS[p]}` }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                        {PILLAR_LABELS[lang][p]}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {pack.deedsPerDay[p]} {lang === 'fr' ? 'actes/jour' : 'deeds/day'}
                        {p !== 'heartset' && pack.durationPerDay[p]
                          ? ` · ${formatDuration(pack.durationPerDay[p]!.value, pack.durationPerDay[p]!.unit, lang)}`
                          : ''}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-500">{copy.pillarWhy[p]}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
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
          </DialogHeader>
          {previewPack && (
            <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-zinc-700 dark:text-zinc-300">
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
          )}
          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row">
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
