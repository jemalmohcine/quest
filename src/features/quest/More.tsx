import { useQuest } from './QuestProvider';
import { questHttp } from '@/services/quest-http';
import { useDeedsRefreshStore } from '@/stores';
import { mapDeedRows } from '@/lib/quest-mappers';
import { UserProfile, PILLARS, Pillar, PILLAR_LABELS, FEELINGS, type DurationObjective } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Globe, Target, Bell, Download, Trash2, LogOut, Info, Camera, Loader2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format, startOfMonth, startOfWeek } from 'date-fns';
import { DURATION_UNITS_GOAL, formatDeedDurationPhrase, type DurationUnit } from '@/lib/duration-units';
import { cn, sumPillarObjectives } from '@/lib/utils';
import { normalizeFeelingKey } from '@/lib/feelings';
import { applyDomTheme, persistTheme } from '@/lib/theme-preference';
import { UI_CONSTANTS } from '@/constants';
import { SectionHeader } from './SectionHeader';
import { GoalPacksPanel } from './GoalPacksPanel';
import { profileMatchesGoalPack } from '@/lib/goal-packs';
import { durationToMinutes } from '@/lib/duration-units';
import type { TranslationKey } from '@/lib/translations';

const GOAL_UNIT_LABEL: Record<DurationUnit, TranslationKey> = {
  seconds: 'durationUnitSeconds',
  minutes: 'durationUnitMinutes',
  hours: 'durationUnitHours',
  days: 'durationUnitDays',
  months: 'durationUnitMonths',
};

type SettingsTab = 'profile' | 'preferences' | 'goals' | 'data';

export function More() {
  const { profile, user, logout, t, updateProfile } = useQuest();
  const bumpDeeds = () => useDeedsRefreshStore.getState().bumpDeedsRefresh();
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('goals');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile?.name || '');
  const [exportFilter, setExportFilter] = useState<'all' | 'week' | 'month'>('all');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pillarDraft, setPillarDraft] = useState<Record<Pillar, string>>({
    soulset: '1',
    healthset: '1',
    mindset: '1',
    skillset: '1',
    heartset: '1',
  });
  const [customFeelingInput, setCustomFeelingInput] = useState('');
  const [goalsDirty, setGoalsDirty] = useState(false);
  const [durationDraft, setDurationDraft] = useState<Record<Pillar, { value: string; unit: DurationUnit }>>({
    soulset: { value: '', unit: 'minutes' },
    healthset: { value: '', unit: 'minutes' },
    mindset: { value: '', unit: 'minutes' },
    skillset: { value: '', unit: 'minutes' },
    heartset: { value: '', unit: 'minutes' },
  });

  const lang = profile?.language || 'en';

  useEffect(() => {
    if (!profile) return;
    const o = profile.objectivePerPillar;
    if (o && PILLARS.every((p) => typeof o[p] === 'number')) {
      setPillarDraft({
        soulset: String(o.soulset),
        healthset: String(o.healthset),
        mindset: String(o.mindset),
        skillset: String(o.skillset),
        heartset: String(o.heartset),
      });
      setGoalsDirty(false);
      return;
    }
    const total = profile.dailyObjective ?? 5;
    const base = Math.max(0, Math.floor(total / 5));
    const remainder = total - base * 5;
    setPillarDraft({
      soulset: String(base + remainder),
      healthset: String(base),
      mindset: String(base),
      skillset: String(base),
      heartset: String(base),
    });
    setGoalsDirty(false);
  }, [profile?.objectivePerPillar, profile?.dailyObjective]);

  useEffect(() => {
    if (!profile) return;
    const next = { ...durationDraft };
    for (const p of PILLARS) {
      if (p === 'heartset') {
        next[p] = { value: '', unit: 'minutes' };
        continue;
      }
      const obj = profile.durationObjectivePerPillar?.[p];
      next[p] = obj ? { value: String(obj.value), unit: obj.unit } : { value: '', unit: 'minutes' };
    }
    setDurationDraft(next);
    setGoalsDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when profile objectives change
  }, [profile?.durationObjectivePerPillar]);

  const markGoalsEdited = () => setGoalsDirty(true);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image is too large. Max size is 2MB.');
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        setIsUpdating(true);
        await updateProfile({ photoURL: base64String });
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setIsUploadingImage(false);
        setIsUpdating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const patchProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    if (updates.theme) {
      persistTheme(updates.theme);
      applyDomTheme(updates.theme);
    }
    setIsUpdating(true);
    try {
      await updateProfile(updates);
      if (updates.name) setIsEditingName(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const commitPillarObjectives = async () => {
    if (!user || !profile) return;
    const next = {} as Record<Pillar, number>;
    PILLARS.forEach((p) => {
      const v = parseInt(pillarDraft[p], 10);
      next[p] = Number.isNaN(v) ? 0 : Math.max(0, Math.min(99, v));
    });
    const total = sumPillarObjectives(next);

    const durationObjectivePerPillar: Partial<Record<Pillar, DurationObjective>> = {};
    for (const p of PILLARS) {
      if (p === 'heartset') continue;
      const d = durationDraft[p];
      const val = parseFloat(d.value);
      if (!Number.isNaN(val) && val > 0) {
        durationObjectivePerPillar[p] = { value: Math.min(9999, val), unit: d.unit };
      }
    }

    const mergedForDetect = {
      ...(profile ?? {}),
      objectivePerPillar: next,
      dailyObjective: total,
      durationObjectivePerPillar,
    } as UserProfile;

    const keepPackId =
      !goalsDirty &&
      profile.goalPackId &&
      profileMatchesGoalPack(mergedForDetect, profile.goalPackId)
        ? profile.goalPackId
        : null;

    await patchProfile({
      objectivePerPillar: next,
      dailyObjective: total,
      durationObjectivePerPillar,
      goalPackId: keepPackId,
    });
    setGoalsDirty(false);
  };

  const syncDraftFromProfile = () => {
    if (!profile) return;
    const o = profile.objectivePerPillar;
    setPillarDraft({
      soulset: String(o.soulset),
      healthset: String(o.healthset),
      mindset: String(o.mindset),
      skillset: String(o.skillset),
      heartset: String(o.heartset),
    });
    const next = { ...durationDraft };
    for (const p of PILLARS) {
      if (p === 'heartset') {
        next[p] = { value: '', unit: 'minutes' };
        continue;
      }
      const obj = profile.durationObjectivePerPillar?.[p];
      next[p] = obj ? { value: String(obj.value), unit: obj.unit } : { value: '', unit: 'minutes' };
    }
    setDurationDraft(next);
    setGoalsDirty(false);
  };

  const addCustomFeeling = async () => {
    if (!user || !profile) return;
    const key = normalizeFeelingKey(customFeelingInput);
    if (!key) return;
    const existing = profile.customFeelings ?? [];
    if ((FEELINGS as readonly string[]).includes(key) || existing.includes(key)) {
      setCustomFeelingInput('');
      return;
    }
    await patchProfile({ customFeelings: [...existing, key] });
    setCustomFeelingInput('');
  };

  const removeCustomFeeling = async (key: string) => {
    if (!user || !profile) return;
    const existing = profile.customFeelings ?? [];
    await patchProfile({ customFeelings: existing.filter((f) => f !== key) });
  };

  const draftObjectiveTotal = PILLARS.reduce((acc, p) => {
    const v = parseInt(pillarDraft[p], 10);
    return acc + (Number.isNaN(v) ? 0 : Math.max(0, Math.min(99, v)));
  }, 0);

  const handleExport = async () => {
    if (!user) return;
    try {
      const { data: raw, error } = await questHttp.listDeeds();
      if (error) throw new Error(error.message);
      let deeds = mapDeedRows(raw);

      if (exportFilter === 'week') {
        const start = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        deeds = deeds.filter((d) => d.date >= start);
      } else if (exportFilter === 'month') {
        const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
        deeds = deeds.filter((d) => d.date >= start);
      }

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        'Date,Time,Pillar,Action,Duration,Feeling,Thought\n' +
        deeds
          .map((d) => {
            const durLabel = formatDeedDurationPhrase(d, t).replace(/"/g, '""');
            return `${d.date},${d.time},${d.pillar},"${d.actionName}","${durLabel}",${d.feeling},"${d.thought || ''}"`;
          })
          .join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `quest_deeds_${exportFilter}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (!user) return;

    try {
      const { error } = await questHttp.deleteAllDeeds();
      if (error) throw new Error(error.message);
      bumpDeeds();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting all deeds:', error);
    }
  };

  const settingsTabs: { id: SettingsTab; label: string }[] = [
    { id: 'goals', label: t('settingsTabGoals') },
    { id: 'profile', label: t('profile') },
    { id: 'preferences', label: t('preferences') },
    { id: 'data', label: t('settingsTabData') },
  ];

  const preferenceRows = [
    {
      id: 'language',
      label: t('language'),
      icon: Globe,
      component: (
        <Select
          value={profile?.language || 'en'}
          onValueChange={(v: 'en' | 'fr' | null) => v && patchProfile({ language: v })}
          disabled={isUpdating}
        >
          <SelectTrigger className={cn('h-11 w-36 border-none bg-zinc-100 text-[10px] font-black uppercase tracking-widest dark:bg-zinc-800', UI_CONSTANTS.buttonRadius)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
            <SelectItem value="en" className="font-bold">
              ENGLISH
            </SelectItem>
            <SelectItem value="fr" className="font-bold">
              FRANÇAIS
            </SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      id: 'theme',
      label: t('theme'),
      icon: Bell,
      component: (
        <Select
          value={profile?.theme || 'system'}
          onValueChange={(v: 'light' | 'dark' | 'system' | null) => v && patchProfile({ theme: v })}
          disabled={isUpdating}
        >
          <SelectTrigger className={cn('h-11 w-36 border-none bg-zinc-100 text-[10px] font-black uppercase tracking-widest dark:bg-zinc-800', UI_CONSTANTS.buttonRadius)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
            <SelectItem value="light" className="font-bold">
              {t('light').toUpperCase()}
            </SelectItem>
            <SelectItem value="dark" className="font-bold">
              {t('dark').toUpperCase()}
            </SelectItem>
            <SelectItem value="system" className="font-bold">
              {t('system').toUpperCase()}
            </SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  ];

  return (
    <div className="animate-in space-y-6 py-4 fade-in duration-500 md:space-y-8 md:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader title={t('settings')} subtitle={t('preferences')} />
        <Button
          variant="outline"
          onClick={logout}
          className={cn(
            'min-h-11 border-zinc-200 px-4 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-red-500/10 hover:text-red-500 dark:border-zinc-800',
            UI_CONSTANTS.buttonRadius,
          )}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('logout')}
        </Button>
      </header>

      <div
        role="tablist"
        aria-label={t('settings')}
        className={cn(
          'flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          '-mx-1 px-1',
        )}
      >
        {settingsTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={settingsTab === tab.id}
            id={`settings-tab-${tab.id}`}
            onClick={() => setSettingsTab(tab.id)}
            className={cn(
              'min-h-11 shrink-0 touch-manipulation rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors',
              settingsTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl space-y-4">
        {settingsTab === 'profile' && (
          <section aria-labelledby="settings-tab-profile" className="space-y-4" role="tabpanel">
            <h3 className="sr-only">{t('profile')}</h3>
            <Card className={cn('group overflow-hidden border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900', UI_CONSTANTS.cardRadius)}>
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-10 md:flex-row">
                  <div className="relative">
                    <div
                      className={cn(
                        'relative flex h-32 w-32 items-center justify-center overflow-hidden bg-indigo-600 shadow-2xl shadow-indigo-500/20 transition-transform group-hover:scale-105',
                        UI_CONSTANTS.cardRadius,
                      )}
                    >
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt={profile.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="h-16 w-16 text-white" />
                      )}

                      {isUploadingImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}

                      <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Camera className="h-10 w-10 text-white" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                      </label>
                    </div>
                  </div>

                  <div className="w-full flex-1 space-y-4 text-center md:text-left">
                    {isEditingName ? (
                      <div className="mx-auto flex max-w-sm items-center gap-2 md:mx-0">
                        <Input
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className={cn('h-12 border-none bg-zinc-50 text-xl font-bold uppercase tracking-tighter dark:bg-zinc-800', UI_CONSTANTS.inputRadius)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void patchProfile({ name: tempName });
                            if (e.key === 'Escape') setIsEditingName(false);
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => void patchProfile({ name: tempName })}
                          disabled={isUpdating}
                          className={cn('h-12 bg-indigo-600 px-6 text-[10px] font-black uppercase tracking-widest text-white', UI_CONSTANTS.buttonRadius)}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-4 md:justify-start">
                          <h3 className="text-4xl font-black uppercase italic tracking-tighter text-zinc-900 dark:text-white">{profile?.name || 'Guest'}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsEditingName(true);
                              setTempName(profile?.name || '');
                            }}
                            className="h-10 w-10 rounded-xl bg-zinc-100 text-zinc-400 hover:text-indigo-500 dark:bg-zinc-800"
                          >
                            <Info className="h-5 w-5" />
                          </Button>
                        </div>
                        <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">{profile?.email}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                      <span className="rounded-full border border-indigo-500/10 bg-indigo-500/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                        Original Member
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {settingsTab === 'preferences' && (
          <section className="space-y-4" role="tabpanel">
            <h3 className="sr-only">{t('preferences')}</h3>
            <Card className={cn('overflow-hidden border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900', UI_CONSTANTS.cardRadius)}>
              <CardContent className="p-0">
                {preferenceRows.map((item, i, arr) => (
                  <div key={item.id}>
                    <div className="flex items-center justify-between p-8 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <div className="flex items-center gap-6">
                        <div className={cn('flex h-12 w-12 items-center justify-center bg-zinc-50 transition-transform hover:scale-110 dark:bg-zinc-800', UI_CONSTANTS.buttonRadius)}>
                          <item.icon className="h-5 w-5 text-zinc-400 group-hover:text-indigo-500" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{item.label}</span>
                      </div>
                      {item.component}
                    </div>
                    {i < arr.length - 1 && <Separator className="mx-8 bg-zinc-100 opacity-50 dark:bg-zinc-800" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {settingsTab === 'goals' && (
          <section className="space-y-4" role="tabpanel">
            <h3 className="sr-only">{t('pillarObjectives')}</h3>
            <Card className={cn('overflow-hidden border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900', UI_CONSTANTS.cardRadius)}>
              <CardContent className="space-y-6 p-6 md:p-8">
                <GoalPacksPanel
                  disabled={isUpdating}
                  goalsDirty={goalsDirty}
                  onApplied={syncDraftFromProfile}
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Target className="h-5 w-5 shrink-0 text-indigo-500" aria-hidden />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                        {t('dailyObjective')}
                      </p>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        {t('totalDailyObjective')}:{' '}
                        <span className="font-black text-indigo-600 dark:text-indigo-400">{draftObjectiveTotal}</span>
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => void commitPillarObjectives()}
                    disabled={isUpdating}
                    className={cn(
                      'min-h-11 w-full shrink-0 touch-manipulation bg-indigo-600 px-5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-500 sm:w-auto',
                      UI_CONSTANTS.buttonRadius,
                    )}
                  >
                    {t('saveChanges')}
                  </Button>
                </div>

                <div
                  className={cn(
                    'divide-y divide-zinc-200/80 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:divide-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/40',
                  )}
                >
                  {PILLARS.map((p) => {
                    const deedN = parseInt(pillarDraft[p], 10);
                    const deedsNum = Number.isNaN(deedN) ? 0 : deedN;
                    const durVal = parseFloat(durationDraft[p].value);
                    const durMin =
                      p !== 'heartset' && !Number.isNaN(durVal) && durVal > 0
                        ? durationToMinutes(durVal, durationDraft[p].unit)
                        : 0;
                    const periodHint =
                      lang === 'fr'
                        ? `Sem. ${deedsNum * 7}${durMin ? ` · ${durMin * 7} min` : ''} · Mois ${deedsNum * 30}${durMin ? ` · ${durMin * 30} min` : ''}`
                        : `Wk ${deedsNum * 7}${durMin ? ` · ${durMin * 7} min` : ''} · Mo ${deedsNum * 30}${durMin ? ` · ${durMin * 30} min` : ''}`;

                    return (
                      <div key={p} className="space-y-1 px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-[5.5rem] shrink-0 truncate text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                            {PILLAR_LABELS[lang][p]}
                          </span>
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                            <label className="sr-only" htmlFor={`deeds-${p}`}>
                              {t('deedsObjective')} {PILLAR_LABELS[lang][p]}
                            </label>
                            <Input
                              id={`deeds-${p}`}
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={99}
                              value={pillarDraft[p]}
                              onChange={(e) => {
                                markGoalsEdited();
                                setPillarDraft((d) => ({ ...d, [p]: e.target.value }));
                              }}
                              className={cn(
                                'h-10 w-[3.25rem] border-none bg-zinc-100 px-2 text-center text-sm font-black tabular-nums dark:bg-zinc-900',
                                UI_CONSTANTS.inputRadius,
                              )}
                              disabled={isUpdating}
                            />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                              {lang === 'fr' ? 'actes/j' : 'deeds/d'}
                            </span>
                            {p !== 'heartset' ? (
                              <>
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  min={0}
                                  value={durationDraft[p].value}
                                  onChange={(e) => {
                                    markGoalsEdited();
                                    setDurationDraft((d) => ({ ...d, [p]: { ...d[p], value: e.target.value } }));
                                  }}
                                  className={cn(
                                    'h-10 w-[3.5rem] border-none bg-zinc-100 px-2 text-center text-sm font-black tabular-nums dark:bg-zinc-900',
                                    UI_CONSTANTS.inputRadius,
                                  )}
                                  disabled={isUpdating}
                                  aria-label={`${t('durationObjectives')} ${PILLAR_LABELS[lang][p]}`}
                                />
                                <Select
                                  value={durationDraft[p].unit}
                                  onValueChange={(v) => {
                                    if (!v) return;
                                    markGoalsEdited();
                                    setDurationDraft((d) => ({ ...d, [p]: { ...d[p], unit: v as DurationUnit } }));
                                  }}
                                  disabled={isUpdating}
                                >
                                  <SelectTrigger
                                    className={cn(
                                      'h-10 w-[4.5rem] border-none bg-zinc-100 text-[9px] font-black uppercase dark:bg-zinc-900',
                                      UI_CONSTANTS.buttonRadius,
                                    )}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white dark:bg-zinc-900">
                                    {DURATION_UNITS_GOAL.map((u) => (
                                      <SelectItem key={u} value={u} className="text-xs font-bold">
                                        {t(GOAL_UNIT_LABEL[u])}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </>
                            ) : (
                              <span className="text-[10px] text-zinc-500">{t('heartsetNoDuration')}</span>
                            )}
                          </div>
                        </div>
                        <p className="pl-[5.5rem] text-[9px] tabular-nums text-zinc-400">{periodHint}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{t('feelings')}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{t('customFeelingsHint')}</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={customFeelingInput}
                      onChange={(e) => setCustomFeelingInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void addCustomFeeling())}
                      placeholder={lang === 'fr' ? 'ex. reconnaissant' : 'e.g. grateful'}
                      className={cn('h-12 flex-1 border-none bg-zinc-100 text-sm dark:bg-zinc-800', UI_CONSTANTS.inputRadius)}
                      disabled={isUpdating}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void addCustomFeeling()}
                      disabled={isUpdating}
                      className={cn('h-12 shrink-0 border-zinc-200 text-[10px] font-black uppercase tracking-widest dark:border-zinc-700', UI_CONSTANTS.buttonRadius)}
                    >
                      {t('addCustomFeeling')}
                    </Button>
                  </div>
                  {(profile?.customFeelings?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile!.customFeelings!.map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 py-1.5 pl-3 pr-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300"
                        >
                          {f}
                          <button
                            type="button"
                            onClick={() => void removeCustomFeeling(f)}
                            disabled={isUpdating}
                            className="rounded-full p-1 hover:bg-indigo-500/20 disabled:opacity-50"
                            aria-label={t('delete')}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {settingsTab === 'data' && (
          <section className="space-y-6" role="tabpanel">
            <h3 className="sr-only">{t('dataManagement')}</h3>
            <Card className={cn('overflow-hidden border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900', UI_CONSTANTS.cardRadius)}>
              <CardContent className="space-y-6 p-8">
                <div className="space-y-3">
                  <p className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Export Range</p>
                  <Select value={exportFilter} onValueChange={(v) => v && setExportFilter(v as 'all' | 'week' | 'month')}>
                    <SelectTrigger className={cn('h-14 w-full border-none bg-zinc-50 text-[10px] font-black uppercase tracking-widest dark:bg-zinc-800', UI_CONSTANTS.inputRadius)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
                      <SelectItem value="all" className="font-bold">
                        ALL TIME
                      </SelectItem>
                      <SelectItem value="week" className="font-bold">
                        THIS WEEK
                      </SelectItem>
                      <SelectItem value="month" className="font-bold">
                        THIS MONTH
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => void handleExport()}
                  className={cn(
                    'h-16 w-full justify-start gap-5 bg-black px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl transition-all hover:-translate-y-1 active:scale-95 dark:bg-zinc-100 dark:text-black',
                    UI_CONSTANTS.buttonRadius,
                  )}
                >
                  <Download className="h-5 w-5" />
                  {t('exportData')}
                </Button>

                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className={cn(
                      'h-16 w-full justify-start gap-5 border-dashed border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-all hover:border-red-500 hover:bg-red-500/10 hover:text-red-500 dark:border-zinc-800',
                      UI_CONSTANTS.buttonRadius,
                    )}
                  >
                    <Trash2 className="h-5 w-5" />
                    {t('deleteAll')}
                  </Button>
                  <DialogContent className={cn('max-w-sm border-none bg-white p-10 dark:bg-zinc-900', UI_CONSTANTS.cardRadius)}>
                    <DialogHeader className="space-y-4 text-left">
                      <DialogTitle className="text-4xl font-black uppercase italic leading-none tracking-tighter text-red-600">Danger Zone</DialogTitle>
                      <DialogDescription className="py-2 text-xs font-bold uppercase leading-relaxed tracking-tighter text-zinc-500">
                        This will permanently delete all your logged deeds and stats. This action <span className="text-red-600 underline">cannot be undone</span>.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex flex-col gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleteModalOpen(false)}
                        className={cn('h-14 border-zinc-200 text-[10px] font-black uppercase tracking-widest dark:border-zinc-800', UI_CONSTANTS.buttonRadius)}
                      >
                        Keep my data
                      </Button>
                      <Button
                        onClick={() => void handleDeleteAll()}
                        className={cn(
                          'h-14 bg-red-600 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-red-500/20 hover:bg-red-500',
                          UI_CONSTANTS.buttonRadius,
                        )}
                      >
                        Delete Everything
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <div className={cn('space-y-8 bg-zinc-100 p-10 text-center dark:bg-zinc-900/50', UI_CONSTANTS.cardRadius)}>
              <div className="space-y-2">
                <div className={cn('mx-auto flex h-14 w-14 items-center justify-center bg-white shadow-sm dark:bg-zinc-800', UI_CONSTANTS.buttonRadius)}>
                  <Info className="h-7 w-7 text-zinc-400" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Quest v1.0.0</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="ghost"
                  className={cn(
                    'h-12 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white hover:text-indigo-600 dark:hover:bg-zinc-800',
                    UI_CONSTANTS.buttonRadius,
                  )}
                >
                  Support & Help
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    'h-12 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white hover:text-indigo-600 dark:hover:bg-zinc-800',
                    UI_CONSTANTS.buttonRadius,
                  )}
                >
                  Send Feedback
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
