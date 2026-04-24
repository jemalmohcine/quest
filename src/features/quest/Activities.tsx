import { useEffect, useState } from 'react';
import { useQuest } from './QuestProvider';
import { questHttp } from '@/services/quest-http';
import { mapDeedRows } from '@/lib/quest-mappers';
import { Deed, PILLAR_LABELS, Pillar } from '@/types';
import { Button } from '@/components/ui/button';
import { DeleteDeedDialog } from './DeleteDeedDialog';
import { EditDeedDialog } from './EditDeedDialog';
import { ChevronLeft, Filter, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DeedCard } from './DeedCard';
import { SectionHeader } from './SectionHeader';
import { UI_CONSTANTS } from '@/constants';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeedsRefreshStore } from '@/stores';

import { isToday, isThisWeek, isThisMonth } from 'date-fns';

export function Activities({ onBack }: { onBack: () => void }) {
  const { user, profile, t } = useQuest();
  const deedsGeneration = useDeedsRefreshStore((s) => s.generation);
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [filterPillar, setFilterPillar] = useState<Pillar | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [deedToDelete, setDeedToDelete] = useState<Deed | null>(null);
  const [deedToEdit, setDeedToEdit] = useState<Deed | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data, error } = await questHttp.listDeeds();
      if (error) {
        console.error('Error fetching activities:', error);
        setIsLoading(false);
        return;
      }
      setDeeds(mapDeedRows(data));
      setIsLoading(false);
    };

    setIsLoading(true);
    void load();
  }, [user, deedsGeneration]);

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

  const filteredDeeds = deeds.filter((deed) => {
    const matchesPillar = filterPillar === 'all' || deed.pillar === filterPillar;
    const matchesSearch =
      deed.actionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deed.thought?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const deedDate = deed.createdAt ? new Date(deed.createdAt) : new Date(deed.date);
    let matchesTime = true;
    if (timeRange === 'today') matchesTime = isToday(deedDate);
    else if (timeRange === 'week') matchesTime = isThisWeek(deedDate);
    else if (timeRange === 'month') matchesTime = isThisMonth(deedDate);

    return matchesPillar && matchesSearch && matchesTime;
  });

  return (
    <div className="py-4 md:py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title={t('allActivities')} subtitle={`${deeds.length} total deeds logged`}>
        <Button
          variant="secondary"
          size="icon"
          onClick={onBack}
          className={cn('w-10 h-10 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800', UI_CONSTANTS.buttonRadius)}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </SectionHeader>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deeds..."
              className={cn(
                'pl-9 h-11 w-full bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm font-medium',
                UI_CONSTANTS.buttonRadius,
              )}
            />
          </div>

          <Select
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v as 'today' | 'week' | 'month' | 'all')}
          >
            <SelectTrigger
              className={cn(
                'h-11 w-full sm:w-40 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs font-bold',
                UI_CONSTANTS.buttonRadius,
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              sideOffset={8}
              align="center"
              className={cn(
                'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-2xl overflow-hidden p-2',
                UI_CONSTANTS.cardRadius,
              )}
            >
              <SelectItem value="today" className="py-2">
                Today
              </SelectItem>
              <SelectItem value="week" className="py-2">
                This Week
              </SelectItem>
              <SelectItem value="month" className="py-2">
                This Month
              </SelectItem>
              <SelectItem value="all" className="py-2">
                All Time
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={filterPillar} onValueChange={(v) => v && setFilterPillar(v as Pillar | 'all')}>
          <SelectTrigger
            className={cn(
              'h-11 w-full sm:w-48 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs font-bold',
              UI_CONSTANTS.buttonRadius,
            )}
          >
            <Filter className="w-3 h-3 mr-2 text-indigo-600 dark:text-indigo-400" />
            <SelectValue placeholder={t('filter')} />
          </SelectTrigger>
          <SelectContent
            sideOffset={8}
            align="center"
            className={cn(
              'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-2xl overflow-hidden p-2',
              UI_CONSTANTS.cardRadius,
            )}
          >
            <SelectItem value="all" className="py-2">
              {t('allPillars')}
            </SelectItem>
            <SelectItem value="soulset" className="py-2">
              {PILLAR_LABELS[profile?.language || 'en'].soulset}
            </SelectItem>
            <SelectItem value="healthset" className="py-2">
              {PILLAR_LABELS[profile?.language || 'en'].healthset}
            </SelectItem>
            <SelectItem value="mindset" className="py-2">
              {PILLAR_LABELS[profile?.language || 'en'].mindset}
            </SelectItem>
            <SelectItem value="skillset" className="py-2">
              {PILLAR_LABELS[profile?.language || 'en'].skillset}
            </SelectItem>
            <SelectItem value="heartset" className="py-2">
              {PILLAR_LABELS[profile?.language || 'en'].heartset}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </>
        ) : filteredDeeds.length === 0 ? (
          <div
            className={cn(
              'col-span-full text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800',
              UI_CONSTANTS.cardRadius,
            )}
          >
            <Search className="w-12 h-12 text-zinc-300 dark:text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No matching deeds found</p>
          </div>
        ) : (
          filteredDeeds.map((deed) => (
            <DeedCard key={deed.id} deed={deed} onEdit={setDeedToEdit} onDelete={setDeedToDelete} />
          ))
        )}
      </div>

      <DeleteDeedDialog deed={deedToDelete} onClose={() => setDeedToDelete(null)} onConfirm={handleDelete} />
      <EditDeedDialog deed={deedToEdit} onClose={() => setDeedToEdit(null)} />
    </div>
  );
}
