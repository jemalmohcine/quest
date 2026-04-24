import { useEffect, useState } from 'react';
import { useQuest } from './QuestProvider';
import { questHttp } from '@/services/quest-http';
import { mapDeedRows } from '@/lib/quest-mappers';
import { Deed, PILLAR_COLORS, PILLAR_LABELS, Pillar, PILLARS } from '@/types';
import { Card } from '@/components/ui/card';
import { DeleteDeedDialog } from './DeleteDeedDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, LabelList, Legend } from 'recharts';
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, eachDayOfInterval, subDays, eachMonthOfInterval, isSameMonth } from 'date-fns';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeedCard } from './DeedCard';
import { UI_CONSTANTS } from '@/constants';
import { SectionHeader } from './SectionHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { EditDeedDialog } from './EditDeedDialog';
import { useDeedsRefreshStore } from '@/stores';

type TimePeriod = 'day' | 'week' | 'month' | 'year';

function localHourFromDeed(d: Deed): number | null {
  const raw = d.time?.trim() ?? '';
  if (raw) {
    const h = parseInt(raw.split(':')[0] ?? '', 10);
    if (!Number.isNaN(h) && h >= 0 && h < 24) return h;
  }
  if (d.createdAt) {
    const dt = new Date(d.createdAt);
    if (!Number.isNaN(dt.getTime())) return dt.getHours();
  }
  return null;
}

function TimeSeriesTooltip({
  active,
  payload,
  label,
  lang,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: Record<string, unknown> }>;
  label?: string;
  lang: 'en' | 'fr';
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const row = payload[0].payload as Record<string, string | number>;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-bold shadow-lg dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100">
      <p className="mb-2 text-sm text-zinc-900 dark:text-white">{label}</p>
      <ul className="space-y-1">
        {PILLARS.map((p) => (
          <li key={p} className="flex justify-between gap-6">
            <span style={{ color: PILLAR_COLORS[p] }}>{PILLAR_LABELS[lang][p]}</span>
            <span className="tabular-nums text-zinc-700 dark:text-zinc-200">{Number(row[p] ?? 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Stats() {
  const { user, profile, t } = useQuest();
  const deedsGeneration = useDeedsRefreshStore((s) => s.generation);
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [filterPillar, setFilterPillar] = useState<Pillar | 'all'>('all');
  const [deedToDelete, setDeedToDelete] = useState<Deed | null>(null);
  const [deedToEdit, setDeedToEdit] = useState<Deed | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const emptyPillarCounts = (): Record<Pillar, number> =>
    PILLARS.reduce((acc, p) => ({ ...acc, [p]: 0 }), {} as Record<Pillar, number>);

  useEffect(() => {
    if (!user) return;

    let startDate: Date;
    const now = new Date();
    setIsLoading(true);

    switch (period) {
      case 'day':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        break;
    }

    const startYmd = format(startDate, 'yyyy-MM-dd');

    const load = async () => {
      const { data, error } = await questHttp.listDeeds({ since: startYmd });
      if (error) {
        console.error('Error fetching stats:', error);
        setIsLoading(false);
        return;
      }
      setDeeds(mapDeedRows(data));
      setIsLoading(false);
    };

    void load();
  }, [user, period, deedsGeneration]);

  const handleDelete = async () => {
    if (!deedToDelete?.id) return;
    try {
      const { error } = await questHttp.deleteDeed(deedToDelete.id);
      if (error) throw new Error(error.message);
      useDeedsRefreshStore.getState().bumpDeedsRefresh();
      setDeedToDelete(null);
    } catch (error) {
      console.error('Error deleting deed:', error);
    }
  };

  const lang = profile?.language ?? 'en';

  const deedsByPillarData = PILLARS.map((pillar) => ({
    name: PILLAR_LABELS[lang][pillar],
    count: deeds.filter((d) => d.pillar === pillar).length,
    pillar: pillar,
    objective: profile?.objectivePerPillar[pillar] || 1,
  }));

  const durationByPillarData = PILLARS.map((pillar) => ({
    name: PILLAR_LABELS[lang][pillar],
    duration: deeds.filter((d) => d.pillar === pillar).reduce((acc, d) => acc + (d.duration || 0), 0),
    pillar: pillar,
    unit: 'min',
  }));

  const feelingsDist = deeds.reduce(
    (acc, deed) => {
      acc[deed.feeling] = (acc[deed.feeling] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const sortedFeelings = Object.entries(feelingsDist)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  const filteredDeeds = filterPillar === 'all' ? deeds : deeds.filter((d) => d.pillar === filterPillar);

  const getTimeSeriesData = (): Record<string, string | number>[] => {
    const now = new Date();
    if (period === 'day') {
      const todayStr = format(startOfDay(now), 'yyyy-MM-dd');
      return Array.from({ length: 24 }, (_, hour) => {
        const row: Record<string, string | number> = { name: `${hour}h`, ...emptyPillarCounts() };
        deeds.forEach((d) => {
          if (d.date !== todayStr) return;
          const h = localHourFromDeed(d);
          if (h !== hour) return;
          row[d.pillar] = (row[d.pillar] as number) + 1;
        });
        return row;
      });
    }

    if (period === 'week') {
      const days = eachDayOfInterval({ start: subDays(now, 6), end: now });
      return days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const row: Record<string, string | number> = {
          name: format(day, 'EEE'),
          date: dateStr,
          ...emptyPillarCounts(),
        };
        deeds
          .filter((d) => d.date === dateStr)
          .forEach((d) => {
            row[d.pillar] = (row[d.pillar] as number) + 1;
          });
        return row;
      });
    }

    if (period === 'month') {
      const days = eachDayOfInterval({ start: subDays(now, 29), end: now });
      return days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const row: Record<string, string | number> = {
          name: format(day, 'd MMM'),
          date: dateStr,
          ...emptyPillarCounts(),
        };
        deeds
          .filter((d) => d.date === dateStr)
          .forEach((d) => {
            row[d.pillar] = (row[d.pillar] as number) + 1;
          });
        return row;
      });
    }

    if (period === 'year') {
      const months = eachMonthOfInterval({ start: startOfYear(now), end: now });
      return months.map((month) => {
        const row: Record<string, string | number> = { name: format(month, 'MMM'), ...emptyPillarCounts() };
        deeds.forEach((d) => {
          const deedDate = new Date(d.date);
          if (isSameMonth(deedDate, month)) row[d.pillar] = (row[d.pillar] as number) + 1;
        });
        return row;
      });
    }

    return [];
  };

  const timeSeriesData = getTimeSeriesData();

  return (
    <div className="py-4 md:py-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter mb-1">{t('stats')}</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">{t('analyzeJourney')}</p>
        </div>

        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 self-start">
          {(['day', 'week', 'month', 'year'] as TimePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-6 py-2 text-xs font-bold rounded-xl transition-all capitalize tracking-wider',
                period === p
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">{t('activityOverTime')}</h2>
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-8 rounded-[2rem] shadow-2xl">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-72 w-full min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timeSeriesData}
                  margin={{
                    top: 8,
                    right: 8,
                    left: 4,
                    bottom: period === 'day' ? 36 : 16,
                  }}
                >
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#52525b', fontSize: period === 'day' ? 9 : 10, fontWeight: 700 }}
                    className="dark:[&_.recharts-cartesian-axis-tick_text]:fill-zinc-400"
                    interval={period === 'day' ? 1 : period === 'month' ? 4 : 0}
                    minTickGap={period === 'day' ? 4 : 8}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(99, 102, 241, 0.08)', radius: 8 }}
                    content={<TimeSeriesTooltip lang={lang} />}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10, fontWeight: 700 }}
                    formatter={(value) => PILLAR_LABELS[lang][value as Pillar] ?? value}
                  />
                  {PILLARS.map((pillar) => (
                    <Bar
                      key={pillar}
                      dataKey={pillar}
                      stackId="pillars"
                      fill={PILLAR_COLORS[pillar]}
                      barSize={period === 'month' ? 8 : 28}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">{t('deedsByPillar')}</h2>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-600/10 dark:bg-indigo-400/10 px-2 py-1 rounded-md">
              {deeds.length} Total
            </span>
          </div>
          <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xl">
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deedsByPillarData} layout="vertical" margin={{ left: 4, right: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="pillar"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      width={96}
                      tick={(props: Record<string, unknown>) => {
                        const x = Number(props.x);
                        const y = Number(props.y);
                        const payload = props.payload as { value: Pillar };
                        const p = payload.value;
                        if (!PILLARS.includes(p)) return <g />;
                        return (
                          <text x={x} y={y} dy={4} textAnchor="end" fill={PILLAR_COLORS[p]} fontSize={11} fontWeight={800}>
                            {PILLAR_LABELS[lang][p]}
                          </text>
                        );
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(99, 102, 241, 0.07)' }}
                      content={({ active, payload: tipPayload }) => {
                        if (!active || !tipPayload?.length) return null;
                        const row = tipPayload[0].payload as { pillar: Pillar };
                        const val = tipPayload[0].value;
                        return (
                          <div
                            className={cn(
                              'rounded-2xl border px-3 py-2.5 text-xs shadow-lg',
                              'border-zinc-200 bg-white text-zinc-900',
                              'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50',
                            )}
                          >
                            <p className="font-black leading-tight" style={{ color: PILLAR_COLORS[row.pillar] }}>
                              {PILLAR_LABELS[lang][row.pillar]}
                            </p>
                            <p className="mt-1.5 font-bold text-zinc-800 dark:text-zinc-100">
                              {t('statsTooltipDeeds')}: {val}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                      {deedsByPillarData.map((entry, index: number) => (
                        <Cell key={`cell-${index}`} fill={PILLAR_COLORS[entry.pillar as keyof typeof PILLAR_COLORS]} />
                      ))}
                      <LabelList
                        dataKey="count"
                        position="right"
                        offset={8}
                        className="fill-zinc-600 dark:fill-zinc-300"
                        fontSize={10}
                        fontWeight={800}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">{t('durationMinutes')}</h2>
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-lg uppercase">Minutes spent</span>
          </div>
          <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xl">
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationByPillarData} layout="vertical" margin={{ left: 4, right: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="pillar"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      width={96}
                      tick={(props: Record<string, unknown>) => {
                        const x = Number(props.x);
                        const y = Number(props.y);
                        const payload = props.payload as { value: Pillar };
                        const p = payload.value;
                        if (!PILLARS.includes(p)) return <g />;
                        return (
                          <text x={x} y={y} dy={4} textAnchor="end" fill={PILLAR_COLORS[p]} fontSize={11} fontWeight={800}>
                            {PILLAR_LABELS[lang][p]}
                          </text>
                        );
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(99, 102, 241, 0.07)' }}
                      content={({ active, payload: tipPayload }) => {
                        if (!active || !tipPayload?.length) return null;
                        const row = tipPayload[0].payload as { pillar: Pillar };
                        const val = tipPayload[0].value;
                        return (
                          <div
                            className={cn(
                              'rounded-2xl border px-3 py-2.5 text-xs shadow-lg',
                              'border-zinc-200 bg-white text-zinc-900',
                              'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50',
                            )}
                          >
                            <p className="font-black leading-tight" style={{ color: PILLAR_COLORS[row.pillar] }}>
                              {PILLAR_LABELS[lang][row.pillar]}
                            </p>
                            <p className="mt-1.5 font-bold text-zinc-800 dark:text-zinc-100">
                              {t('statsTooltipDuration')}: {val} min
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="duration" radius={[0, 6, 6, 0]} barSize={24}>
                      {durationByPillarData.map((entry, index: number) => (
                        <Cell key={`cell-${index}`} fill={PILLAR_COLORS[entry.pillar as keyof typeof PILLAR_COLORS]} />
                      ))}
                      <LabelList
                        dataKey="duration"
                        position="right"
                        offset={8}
                        className="fill-zinc-600 dark:fill-zinc-300"
                        fontSize={10}
                        fontWeight={800}
                        formatter={(val) => `${Number(val)}m`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">{t('feelings')}</h2>
          <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xl h-full">
            <div className="space-y-6">
              {sortedFeelings.length === 0 ? (
                <div className="text-center py-12 text-zinc-600 text-sm italic">No data yet</div>
              ) : (
                sortedFeelings.map(([feeling, count]) => (
                  <div key={feeling} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 capitalize truncate">{feeling}</span>
                      <span className="text-xs font-black text-zinc-500 dark:text-zinc-400 shrink-0">{count}</span>
                    </div>
                    <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                        style={{ width: `${((count as number) / deeds.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        <section className="lg:col-span-2 space-y-6 pt-4">
          <SectionHeader title={t('deedHistory')}>
            <Select value={filterPillar} onValueChange={(v: string | null) => v && setFilterPillar(v as Pillar | 'all')}>
              <SelectTrigger
                className={cn(
                  'h-10 w-36 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs font-bold shadow-sm',
                  UI_CONSTANTS.buttonRadius,
                )}
              >
                <Filter className="w-3 h-3 mr-2 text-indigo-600 dark:text-indigo-400" />
                <SelectValue placeholder={t('filter')} />
              </SelectTrigger>
              <SelectContent
                className={cn(
                  'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-2xl overflow-hidden',
                  UI_CONSTANTS.cardRadius,
                )}
              >
                <SelectItem value="all">{t('allPillars')}</SelectItem>
                <SelectItem value="soulset">{PILLAR_LABELS[profile?.language || 'en'].soulset}</SelectItem>
                <SelectItem value="healthset">{PILLAR_LABELS[profile?.language || 'en'].healthset}</SelectItem>
                <SelectItem value="mindset">{PILLAR_LABELS[profile?.language || 'en'].mindset}</SelectItem>
                <SelectItem value="skillset">{PILLAR_LABELS[profile?.language || 'en'].skillset}</SelectItem>
                <SelectItem value="heartset">{PILLAR_LABELS[profile?.language || 'en'].heartset}</SelectItem>
              </SelectContent>
            </Select>
          </SectionHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </>
            ) : (
              filteredDeeds.map((deed) => (
                <DeedCard key={deed.id} deed={deed} onEdit={setDeedToEdit} onDelete={setDeedToDelete} />
              ))
            )}
          </div>
        </section>
      </div>

      <DeleteDeedDialog deed={deedToDelete} onClose={() => setDeedToDelete(null)} onConfirm={handleDelete} />
      <EditDeedDialog deed={deedToEdit} onClose={() => setDeedToEdit(null)} />
    </div>
  );
}
