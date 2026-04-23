import { useFirebase } from './FirebaseProvider';
import { db, doc, updateDoc, collection, getDocs, writeBatch, query, where } from '../lib/firebase';
import { UserProfile, PILLARS, Pillar, PILLAR_LABELS, FEELINGS } from '../types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { User, Globe, Target, Bell, Download, Trash2, LogOut, Info, Camera, Loader2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format, startOfMonth, startOfWeek } from 'date-fns';
import { cn, sumPillarObjectives } from '../lib/utils';
import { normalizeFeelingKey } from '../lib/feelings';
import { applyDomTheme, persistTheme } from '../lib/theme-preference';
import { UI_CONSTANTS } from '../constants';
import { SectionHeader } from './SectionHeader';

type SettingsTab = 'profile' | 'preferences' | 'goals' | 'data';

export function More() {
  const { profile, user, logout, t } = useFirebase();
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
  }, [profile?.objectivePerPillar, profile?.dailyObjective]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Max size is 2MB.");
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        await updateProfile({ photoURL: base64String });
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    if (updates.theme) {
      persistTheme(updates.theme);
      applyDomTheme(updates.theme);
    }
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
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
    await updateProfile({ objectivePerPillar: next, dailyObjective: total });
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
    await updateProfile({ customFeelings: [...existing, key] });
    setCustomFeelingInput('');
  };

  const removeCustomFeeling = async (key: string) => {
    if (!user || !profile) return;
    const existing = profile.customFeelings ?? [];
    await updateProfile({ customFeelings: existing.filter((f) => f !== key) });
  };

  const draftObjectiveTotal = PILLARS.reduce((acc, p) => {
    const v = parseInt(pillarDraft[p], 10);
    return acc + (Number.isNaN(v) ? 0 : Math.max(0, Math.min(99, v)));
  }, 0);

  const handleExport = async () => {
    if (!user) return;
    try {
      let deedsRef = collection(db, 'users', user.uid, 'deeds');
      let q = query(deedsRef);

      if (exportFilter === 'week') {
        const start = format(startOfWeek(new Date()), 'yyyy-MM-dd');
        q = query(deedsRef, where('date', '>=', start));
      } else if (exportFilter === 'month') {
        const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
        q = query(deedsRef, where('date', '>=', start));
      }

      const snapshot = await getDocs(q);
      const deeds = snapshot.docs.map(doc => doc.data());
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Date,Time,Pillar,Action,Duration,Feeling,Thought\n"
        + deeds.map(d => `${d.date},${d.time},${d.pillar},"${d.actionName}",${d.duration || ''},${d.feeling},"${d.thought || ''}"`).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `quest_deeds_${exportFilter}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
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
      const deedsRef = collection(db, 'users', user.uid, 'deeds');
      const snapshot = await getDocs(deedsRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
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
          onValueChange={(v: 'en' | 'fr' | null) => v && updateProfile({ language: v })}
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
          onValueChange={(v: 'light' | 'dark' | 'system' | null) => v && updateProfile({ theme: v })}
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
            'h-10 border-zinc-200 px-4 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-red-500/10 hover:text-red-500 dark:border-zinc-800',
            UI_CONSTANTS.buttonRadius
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
          '-mx-1 px-1'
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
              'shrink-0 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors',
              settingsTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
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
                        UI_CONSTANTS.cardRadius
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
                            if (e.key === 'Enter') updateProfile({ name: tempName });
                            if (e.key === 'Escape') setIsEditingName(false);
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => updateProfile({ name: tempName })}
                          disabled={isUpdating}
                          className={cn('h-12 bg-indigo-600 px-6 text-[10px] font-black uppercase tracking-widest text-white', UI_CONSTANTS.buttonRadius)}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-4 md:justify-start">
                          <h3 className="text-4xl font-black uppercase italic tracking-tighter text-zinc-900 dark:text-white">
                            {profile?.name || 'Guest'}
                          </h3>
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
              <CardContent className="space-y-8 p-6 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center bg-zinc-50 dark:bg-zinc-800', UI_CONSTANTS.buttonRadius)}>
                      <Target className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{t('dailyObjective')}</p>
                      <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {t('totalDailyObjective')}:{' '}
                        <span className="font-black text-indigo-600 dark:text-indigo-400">{draftObjectiveTotal}</span>
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => commitPillarObjectives()}
                    disabled={isUpdating}
                    className={cn(
                      'h-11 shrink-0 bg-indigo-600 px-6 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-500',
                      UI_CONSTANTS.buttonRadius
                    )}
                  >
                    {t('saveChanges')}
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {PILLARS.map((p) => (
                    <div key={p} className="min-w-0 space-y-2">
                      <label className="block truncate text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                        {PILLAR_LABELS[lang][p]}
                      </label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={99}
                        value={pillarDraft[p]}
                        onChange={(e) => setPillarDraft((d) => ({ ...d, [p]: e.target.value }))}
                        className={cn('h-12 border-none bg-zinc-100 text-sm font-black text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100', UI_CONSTANTS.inputRadius)}
                        disabled={isUpdating}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{t('feelings')}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{t('customFeelingsHint')}</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={customFeelingInput}
                      onChange={(e) => setCustomFeelingInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomFeeling())}
                      placeholder={lang === 'fr' ? 'ex. reconnaissant' : 'e.g. grateful'}
                      className={cn('h-12 flex-1 border-none bg-zinc-100 text-sm dark:bg-zinc-800', UI_CONSTANTS.inputRadius)}
                      disabled={isUpdating}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addCustomFeeling()}
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
                            onClick={() => removeCustomFeeling(f)}
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
                  <Select value={exportFilter} onValueChange={(v: any) => setExportFilter(v)}>
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
                  onClick={handleExport}
                  className={cn(
                    'h-16 w-full justify-start gap-5 bg-black px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl transition-all hover:-translate-y-1 active:scale-95 dark:bg-zinc-100 dark:text-black',
                    UI_CONSTANTS.buttonRadius
                  )}
                >
                  <Download className="h-5 w-5" />
                  {t('exportData')}
                </Button>

                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                  <DialogTrigger>
                    <Button
                      variant="outline"
                      className={cn(
                        'h-16 w-full justify-start gap-5 border-dashed border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-all hover:border-red-500 hover:bg-red-500/10 hover:text-red-500 dark:border-zinc-800',
                        UI_CONSTANTS.buttonRadius
                      )}
                    >
                      <Trash2 className="h-5 w-5" />
                      {t('deleteAll')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={cn('max-w-sm border-none bg-white p-10 dark:bg-zinc-900', UI_CONSTANTS.cardRadius)}>
                    <DialogHeader className="space-y-4 text-left">
                      <DialogTitle className="text-4xl font-black uppercase italic leading-none tracking-tighter text-red-600">Danger Zone</DialogTitle>
                      <DialogDescription className="py-2 text-xs font-bold uppercase leading-relaxed tracking-tighter text-zinc-500">
                        This will permanently delete all your logged deeds and stats. This action{' '}
                        <span className="text-red-600 underline">cannot be undone</span>.
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
                        onClick={handleDeleteAll}
                        className={cn(
                          'h-14 bg-red-600 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-red-500/20 hover:bg-red-500',
                          UI_CONSTANTS.buttonRadius
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
                    UI_CONSTANTS.buttonRadius
                  )}
                >
                  Support & Help
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    'h-12 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white hover:text-indigo-600 dark:hover:bg-zinc-800',
                    UI_CONSTANTS.buttonRadius
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
