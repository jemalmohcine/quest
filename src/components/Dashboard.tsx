import { useEffect, useMemo, useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { db, collection, query, where, orderBy, limit, onSnapshot, deleteDoc, doc } from '../lib/firebase';
import { Deed, PILLARS, PILLAR_COLORS, PILLAR_LABELS } from '../types';
import { PILLAR_ICONS, UI_CONSTANTS } from '../constants';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { DeleteDeedDialog } from './DeleteDeedDialog';
import { Sparkles, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip, LabelList } from 'recharts';
import { cn, dailyProgressBreakdown, pillarDailyTarget } from '../lib/utils';
import { DeedCard } from './DeedCard';
import { EditDeedDialog } from './EditDeedDialog';
import { SectionHeader } from './SectionHeader';
import { Skeleton } from './ui/skeleton';

export function Dashboard({ onTabChange }: { 
  onTabChange?: (tab: 'dashboard' | 'stats' | 'resumes' | 'more' | 'activities') => void
}) {
  const { user, profile, t } = useFirebase();
  const [todayDeeds, setTodayDeeds] = useState<Deed[]>([]);
  const [recentDeeds, setRecentDeeds] = useState<Deed[]>([]);
  const [deedToDelete, setDeedToDelete] = useState<Deed | null>(null);
  const [deedToEdit, setDeedToEdit] = useState<Deed | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let todayReady = false;
    let recentReady = false;
    const trySetLoaded = () => {
      if (todayReady && recentReady) setIsLoading(false);
    };

    const today = format(new Date(), 'yyyy-MM-dd');
    const deedsRef = collection(db, 'users', user.uid, 'deeds');

    const todayQuery = query(deedsRef, where('date', '==', today));
    const unsubscribeToday = onSnapshot(
      todayQuery,
      (snapshot) => {
        const deeds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deed));
        setTodayDeeds(deeds);
        todayReady = true;
        trySetLoaded();
      },
      (err) => {
        console.error('Error fetching today deeds:', err);
        setIsLoading(false);
      }
    );

    const recentQuery = query(deedsRef, orderBy('createdAt', 'desc'), limit(4));
    const unsubscribeRecent = onSnapshot(
      recentQuery,
      (snapshot) => {
        const deeds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deed));
        setRecentDeeds(deeds);
        recentReady = true;
        trySetLoaded();
      },
      (err) => {
        console.error('Error fetching recent deeds:', err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribeToday();
      unsubscribeRecent();
    };
  }, [user]);

  const totalToday = todayDeeds.length;
  const { effective: progressEffective, target: dailyTarget, percent: progressPercent } = dailyProgressBreakdown(
    profile,
    todayDeeds
  );
  const dailyGoalComplete = progressPercent >= 100;
  const dashLang = profile?.language || 'en';

  const pillarDistributionData = useMemo(
    () =>
      PILLARS.map((pillar) => {
        const count = todayDeeds.filter((d) => d.pillar === pillar).length;
        return {
          name: PILLAR_LABELS[dashLang][pillar],
          count,
          pillar,
          objective: profile?.objectivePerPillar?.[pillar] || 1,
        };
      }),
    [todayDeeds, dashLang, profile?.objectivePerPillar]
  );

  const handleDelete = async () => {
    if (!user || !deedToDelete?.id) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'deeds', deedToDelete.id));
      setDeedToDelete(null);
    } catch (error) {
      console.error('Error deleting deed:', error);
    }
  };

  return (
    <div className="py-4 md:py-8 space-y-8">
      <header className="flex items-center justify-between">
        <div className="group cursor-pointer" onClick={() => onTabChange?.('dashboard')}>
          <h1 className="text-4xl font-extrabold tracking-tighter mb-1 group-hover:text-indigo-600 transition-colors uppercase italic">Quest</h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">{t('welcome')}, <span className="text-zinc-900 dark:text-white">{profile?.name || 'Guest'}</span></p>
        </div>
        <div 
          className={cn("w-12 h-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-xl cursor-pointer hover:border-indigo-500/50 transition-all active:scale-95 group overflow-hidden", UI_CONSTANTS.iconRadius)}
          onClick={() => onTabChange?.('more')}
        >
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <UserIcon className="w-6 h-6 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Progress Card */}
        <Card className={cn("lg:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 border-none shadow-2xl shadow-indigo-500/20 overflow-hidden relative group", UI_CONSTANTS.cardRadius)}>
          {isLoading ? (
            <CardContent className="p-8 space-y-8">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32 bg-white/20" />
                  <Skeleton className="h-16 w-48 bg-white/20" />
                  <Skeleton className="h-4 w-40 bg-white/20" />
                </div>
                <Skeleton className="w-32 h-32 rounded-full bg-white/20" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full rounded-2xl bg-white/10" />)}
              </div>
            </CardContent>
          ) : (
            <>
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="w-32 h-32 text-white" />
              </div>
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <h2 className="text-indigo-100 text-sm font-semibold uppercase tracking-widest">{t('dailyProgress')}</h2>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black text-white">{progressEffective}</span>
                      <span className="text-2xl font-medium text-indigo-200">/ {dailyTarget}</span>
                    </div>
                    <p className="text-indigo-100/80 font-medium">{t('deedsCompletedTowardGoal')}</p>
                    {totalToday > progressEffective && (
                      <p className="text-xs font-semibold text-indigo-200/90">
                        {t('deedsTotalToday')}: {totalToday}
                      </p>
                    )}
                  </div>
                  
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-indigo-900/30"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={364.4}
                        strokeDashoffset={364.4 - (364.4 * Math.min(100, progressPercent)) / 100}
                        strokeLinecap="round"
                        className="text-white transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <span className="absolute text-xl font-bold text-white">{progressPercent}%</span>
                  </div>
                </div>

                {dailyGoalComplete && (
                  <div
                    className={cn(
                      'mt-8 flex items-start gap-3 rounded-2xl border border-white/25 bg-white/15 p-4 backdrop-blur-md',
                      'animate-in fade-in duration-500'
                    )}
                  >
                    <Sparkles className="mt-0.5 h-6 w-6 shrink-0 text-amber-200" />
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-black uppercase tracking-wide text-white">{t('dailyGoalCompleteTitle')}</p>
                      <p className="text-sm font-medium leading-snug text-indigo-50">{t('dailyGoalCompleteMessage')}</p>
                    </div>
                  </div>
                )}

                <div className="mt-12 grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {PILLARS.map(pillar => {
                    const Icon = PILLAR_ICONS[pillar];
                    const target = pillarDailyTarget(profile, pillar);
                    const countToday = todayDeeds.filter((d) => d.pillar === pillar).length;
                    const isDone = target > 0 && countToday >= target;
                    return (
                      <div key={pillar} className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all",
                        isDone ? "bg-white/20 backdrop-blur-md" : "bg-black/10"
                      )}>
                        <Icon className={cn("w-5 h-5", isDone ? "text-white" : "text-indigo-300/50")} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-white/80 text-center leading-tight">
                          {PILLAR_LABELS[dashLang][pillar].slice(0, 8)}
                        </span>
                        {target > 0 && (
                          <span className="text-[9px] font-black tabular-nums text-white/70">
                            {countToday}/{target}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Quick Stats Card */}
        <Card className={cn("bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl", UI_CONSTANTS.cardRadius)}>
          <CardHeader>
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t('pillarDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <div className="space-y-2">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
              </div>
            ) : (
              <>
                <div className="h-48 min-h-[200px] w-full max-md:pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pillarDistributionData}>
                      <XAxis 
                        dataKey="name" 
                        hide
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(99, 102, 241, 0.12)' }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const row = payload[0].payload as { name: string; count: number };
                          const v = payload[0].value as number;
                          return (
                            <div className="rounded-xl border border-zinc-500/50 bg-zinc-950 px-3 py-2 text-[10px] font-bold tracking-tight text-white shadow-lg">
                              {row.name}: {v}
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 6, 6]}>
                        {pillarDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PILLAR_COLORS[entry.pillar as keyof typeof PILLAR_COLORS]} />
                        ))}
                        <LabelList
                          dataKey="count"
                          position="center"
                          fill="#ffffff"
                          fontSize={12}
                          fontWeight={800}
                          formatter={(v: number) => (v > 0 ? String(v) : '')}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 space-y-3">
                  {pillarDistributionData.map((item) => (
                    <div key={item.pillar} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PILLAR_COLORS[item.pillar as keyof typeof PILLAR_COLORS] }} />
                        <span className="text-xs font-medium text-zinc-400">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-6">
        <SectionHeader 
          title={t('recentActivity')}
          subtitle={`${recentDeeds.length} deeds logged recently`}
        >
          <Button 
            variant="link" 
            onClick={() => onTabChange?.('activities')}
            className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest p-0 hover:no-underline hover:text-indigo-500"
          >
            {t('viewAll')}
          </Button>
        </SectionHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </>
          ) : recentDeeds.length === 0 ? (
            <div className={cn("col-span-full text-center py-12 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 border-dashed", UI_CONSTANTS.cardRadius)}>
              <Sparkles className="w-12 h-12 text-zinc-300 dark:text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500 font-medium">{t('noDeeds')}</p>
            </div>
          ) : (
            recentDeeds.map(deed => (
              <DeedCard 
                key={deed.id} 
                deed={deed} 
                onEdit={setDeedToEdit}
                onDelete={setDeedToDelete}
                showThought={false}
              />
            ))
          )}
        </div>

        <DeleteDeedDialog 
          deed={deedToDelete}
          onClose={() => setDeedToDelete(null)}
          onConfirm={handleDelete}
        />
        <EditDeedDialog deed={deedToEdit} onClose={() => setDeedToEdit(null)} />
      </section>

    </div>
  );
}
