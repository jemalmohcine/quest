import { useMemo, useState } from 'react';
import { useQuest } from './QuestProvider';
import {
  GOAL_PACKS,
  goalPackToProfileSettings,
  resolveDisplayedGoalPack,
  type GoalPackId,
} from '@/lib/goal-packs';
import { PILLARS, PILLAR_COLORS, PILLAR_LABELS, type Pillar } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UI_CONSTANTS } from '@/constants';
import { ChevronDown, ChevronUp, Loader2, Package } from 'lucide-react';
import type { DurationUnit } from '@/lib/duration-units';

type Props = {
  disabled?: boolean;
  goalsDirty?: boolean;
  onApplied?: () => void;
};

function formatDuration(value: number, unit: DurationUnit, lang: 'en' | 'fr') {
  if (unit !== 'minutes') return `${value} ${unit}`;
  return lang === 'fr' ? `${value} min` : `${value} min`;
}

export function GoalPacksPanel({ disabled, goalsDirty, onApplied }: Props) {
  const { profile, t, updateProfile } = useQuest();
  const lang = profile?.language === 'fr' ? 'fr' : 'en';
  const [applyingId, setApplyingId] = useState<GoalPackId | null>(null);
  const [whyOpen, setWhyOpen] = useState<Partial<Record<GoalPackId, boolean>>>({});
  const [appliedHint, setAppliedHint] = useState<string | null>(null);

  const active = useMemo(
    () => resolveDisplayedGoalPack(profile, { treatAsCustom: goalsDirty }),
    [profile, goalsDirty],
  );

  const activeLabel = useMemo(() => {
    if (goalsDirty || active === 'custom' || !active) return t('goalPackCustom');
    const pack = GOAL_PACKS.find((p) => p.id === active);
    return pack?.copy[lang].name ?? t('goalPackCustom');
  }, [active, goalsDirty, lang, t]);

  const applyPack = async (id: GoalPackId) => {
    setApplyingId(id);
    try {
      const patch = goalPackToProfileSettings(id);
      await updateProfile(patch);
      onApplied?.();
      setAppliedHint(t('goalPackApplied'));
      window.setTimeout(() => setAppliedHint(null), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-3 border-b border-zinc-100 pb-5 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-2">
        <Package className="h-4 w-4 text-indigo-500" aria-hidden />
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('goalPacksTitle')}</p>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {t('goalPackActive')}: {activeLabel}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{t('goalPacksIntro')}</p>
      {appliedHint && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400" role="status">
          {appliedHint}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {GOAL_PACKS.map((pack) => {
          const copy = pack.copy[lang];
          const isActive = !goalsDirty && active === pack.id;
          const detail = !!whyOpen[pack.id];
          const applying = applyingId === pack.id;

          return (
            <Card
              key={pack.id}
              className={cn(
                'border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/60',
                isActive && 'ring-2 ring-indigo-500/40',
                UI_CONSTANTS.cardRadius,
              )}
            >
              <CardContent className="space-y-2.5 p-3 sm:p-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight text-zinc-900 dark:text-white sm:text-sm">
                    {copy.name}
                  </h4>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-600 dark:text-zinc-400">{copy.tagline}</p>
                </div>
                <p className="line-clamp-2 text-[10px] italic leading-snug text-indigo-700/90 dark:text-indigo-300/90">
                  {copy.summaryWhy}
                </p>
                <ul className="space-y-1 text-[10px] text-zinc-800 dark:text-zinc-200">
                  {PILLARS.map((p: Pillar) => (
                    <li key={p} className="flex gap-1.5" style={{ borderLeft: `2px solid ${PILLAR_COLORS[p]}`, paddingLeft: 6 }}>
                      <span className="shrink-0 font-bold uppercase tracking-wide text-zinc-500">{PILLAR_LABELS[lang][p]}</span>
                      <span className="tabular-nums">
                        {pack.deedsPerDay[p]} {lang === 'fr' ? 'j' : 'd'}
                        {p !== 'heartset' && pack.durationPerDay[p]
                          ? ` · ${formatDuration(pack.durationPerDay[p]!.value, pack.durationPerDay[p]!.unit, lang)}`
                          : ''}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="flex min-h-9 w-full items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500"
                  aria-expanded={detail}
                  onClick={() => setWhyOpen((o) => ({ ...o, [pack.id]: !o[pack.id] }))}
                >
                  {detail ? t('goalPackHideDetail') : t('goalPackViewDetail')}
                  {detail ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {detail && (
                  <ul className="max-h-28 space-y-1 overflow-y-auto text-[10px] text-zinc-500">
                    {PILLARS.map((p: Pillar) => (
                      <li key={p}>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">{PILLAR_LABELS[lang][p]}:</span> {copy.pillarWhy[p]}
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  type="button"
                  variant={isActive ? 'outline' : 'default'}
                  disabled={disabled || !!applyingId}
                  onClick={() => void applyPack(pack.id)}
                  className={cn(
                    'min-h-11 w-full text-[10px] font-black uppercase tracking-widest',
                    UI_CONSTANTS.buttonRadius,
                    !isActive && 'bg-indigo-600 text-white hover:bg-indigo-500',
                  )}
                >
                  {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isActive ? t('goalPackSelected') : t('goalPackApply')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
