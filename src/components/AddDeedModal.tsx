import { useState, useEffect, useMemo } from 'react';
import { useFirebase } from './FirebaseProvider';
import { db, collection, addDoc, Timestamp, handleFirestoreError, OperationType, query, orderBy, limit, onSnapshot } from '../lib/firebase';
import { PILLARS, PILLAR_LABELS, Pillar } from '../types';
import { allFeelingOptions } from '../lib/feelings';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { cn, deedFieldsFromDateAndTime } from '../lib/utils';
import { UI_CONSTANTS } from '../constants';
import { Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { DeedDateTimeComboField } from './DeedDateTimeFields';

interface AddDeedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDeedModal({ isOpen, onClose }: AddDeedModalProps) {
  const { user, profile, t } = useFirebase();
  const lang = profile?.language || 'en';
  const dateLocale = lang === 'fr' ? fr : enUS;
  const [pillar, setPillar] = useState<Pillar>('soulset');
  const [actionName, setActionName] = useState('');
  const [duration, setDuration] = useState('');
  const [thought, setThought] = useState('');
  const [feeling, setFeeling] = useState<string>('happy');
  const [dateStr, setDateStr] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [timeStr, setTimeStr] = useState(() => format(new Date(), 'HH:mm'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<Record<string, { count: number; lastDuration: string; lastFeeling: string; pillar: Pillar }>>({});
  const feelingOptions = useMemo(() => allFeelingOptions(profile), [profile]);

  useEffect(() => {
    if (feelingOptions.length && !feelingOptions.includes(feeling)) {
      setFeeling(feelingOptions[0]);
    }
  }, [feelingOptions, feeling]);

  useEffect(() => {
    if (!isOpen) return;
    const now = new Date();
    setDateStr(format(now, 'yyyy-MM-dd'));
    setTimeStr(format(now, 'HH:mm'));
  }, [isOpen]);

  useEffect(() => {
    if (!user || !isOpen) return;

    const deedsRef = collection(db, 'users', user.uid, 'deeds');
    const q = query(deedsRef, orderBy('createdAt', 'desc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stats: Record<string, { count: number; lastDuration: string; lastFeeling: string; pillar: Pillar }> = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const key = `${data.pillar}:${data.actionName}`;
        if (!stats[key]) {
          stats[key] = {
            count: 0,
            lastDuration: data.duration?.toString() || '',
            lastFeeling: data.feeling || 'happy',
            pillar: data.pillar as Pillar,
          };
        }
        stats[key].count += 1;
      });

      setHistory(stats);
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  const getSuggestions = (currentPillar: Pillar) => {
    const DEFAULT_SUGGESTIONS: Record<Pillar, string[]> = {
      soulset: ['Morning Meditation', 'Gratitude Journal', 'Sunset Prayer', 'Scripture Reading', 'Deep Breathing'],
      healthset: ['2km Run', 'Hydration (2L)', 'Pushups', 'Cold Shower', 'Healthy Breakfast'],
      mindset: ['Deep Work (90m)', 'Book Reading', 'Logic Puzzle', 'Language Practice', 'Podcast Learning'],
      skillset: ['Coding Session', 'Guitar Practice', 'Design Brief', 'Writing Draft', 'Public Speaking'],
      heartset: ['Call Family', 'Active Listening', 'Volunteer Work', 'Kind Gesture', 'Date Night'],
    };

    const userSuggestions = Object.entries(history)
      .filter(([, val]) => val.pillar === currentPillar)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([key]) => key.split(':')[1]);

    if (userSuggestions.length > 0) return userSuggestions;
    return DEFAULT_SUGGESTIONS[currentPillar];
  };

  const currentSuggestions = getSuggestions(pillar);

  const handleSuggestionClick = (suggestion: string) => {
    setActionName(suggestion);
    const historyKey = `${pillar}:${suggestion}`;
    const pastData = history[historyKey];
    if (pastData) {
      setDuration(pastData.lastDuration);
      setFeeling(pastData.lastFeeling);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !actionName || !dateStr || !timeStr) return;

    setIsSubmitting(true);
    const path = `users/${user.uid}/deeds`;
    try {
      const [y, mo, d] = dateStr.split('-').map((n) => parseInt(n, 10));
      const [hh, mi] = timeStr.split(':').map((n) => parseInt(n, 10));
      const when = new Date(y, mo - 1, d, hh || 0, mi || 0, 0, 0);

      const deedData: Record<string, unknown> = {
        pillar,
        actionName,
        feeling,
        createdAt: Timestamp.fromDate(when),
        ...deedFieldsFromDateAndTime(dateStr, timeStr),
      };

      if (duration) {
        const du = parseInt(duration, 10);
        if (!Number.isNaN(du)) deedData.duration = Math.max(0, du);
      }
      if (thought) {
        deedData.thought = thought;
      }

      await addDoc(collection(db, 'users', user.uid, 'deeds'), deedData);

      setActionName('');
      setDuration('');
      setThought('');
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'flex w-full max-h-[min(92dvh,calc(100dvh-1rem))] flex-col gap-0 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-white p-0 touch-pan-y [-webkit-overflow-scrolling:touch] dark:border-zinc-800 dark:bg-zinc-900 dark:text-white sm:max-w-[425px]',
          'border-zinc-200 text-zinc-900',
          UI_CONSTANTS.cardRadius
        )}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-center gap-4 bg-indigo-600 p-6 pr-14 shadow-sm">
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center bg-white/20 backdrop-blur-sm', UI_CONSTANTS.buttonRadius)}>
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-xl font-bold leading-none tracking-tight text-white">{t('logDeed')}</DialogTitle>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-indigo-100">{t('logDeedTagline')}</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6 pb-[max(2rem,calc(1rem+env(safe-area-inset-bottom,0px)))]"
        >
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="action" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                {t('actionName')} *
              </Label>
              <Input
                id="action"
                placeholder={t('whatAccomplished')}
                value={actionName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActionName(e.target.value)}
                required
                className={cn(
                  'box-border h-11 min-h-11 max-h-11 py-0 leading-none bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-indigo-500 text-zinc-900 dark:text-white font-bold',
                  UI_CONSTANTS.buttonRadius
                )}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {currentSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all active:scale-95',
                    actionName === suggestion
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="pillar" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                {t('pillar')} *
              </Label>
              <Select value={pillar} onValueChange={(v: string | null) => v && setPillar(v as Pillar)}>
                <SelectTrigger
                  className={cn(
                    'box-border h-11 min-h-11 w-full shrink-0 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-indigo-500 text-zinc-900 dark:text-white font-bold',
                    UI_CONSTANTS.buttonRadius
                  )}
                >
                  <SelectValue placeholder={t('pillar')} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white">
                  {PILLARS.map((p) => (
                    <SelectItem key={p} value={p} className="focus:bg-indigo-600 focus:text-white font-bold">
                      {PILLAR_LABELS[lang][p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="duration" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                {t('duration')}
              </Label>
              <Input
                id="duration"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                placeholder="30"
                value={duration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDuration(e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className={cn(
                  'box-border h-11 min-h-11 max-h-11 w-full py-0 leading-none bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-indigo-500 text-zinc-900 dark:text-white font-bold tabular-nums',
                  UI_CONSTANTS.buttonRadius
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feeling-add" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {t('feeling')} *
            </Label>
            <Select value={feeling} onValueChange={(v: string | null) => v && setFeeling(v)}>
              <SelectTrigger
                className={cn(
                  'box-border h-11 min-h-11 w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-indigo-500 text-zinc-900 dark:text-white font-bold',
                  UI_CONSTANTS.buttonRadius
                )}
              >
                <SelectValue placeholder={t('feeling')} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white">
                {feelingOptions.map((f) => (
                  <SelectItem key={f} value={f} className="capitalize focus:bg-indigo-600 focus:text-white font-bold">
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DeedDateTimeComboField
            label={t('dateAndTime')}
            timeSectionLabel={t('deedTime')}
            dateStr={dateStr}
            timeStr={timeStr}
            onDateChange={setDateStr}
            onTimeChange={setTimeStr}
            locale={dateLocale}
            applyLabel={t('timePickerApply')}
          />

          <div className="space-y-2">
            <Label htmlFor="thought" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {t('thought')}
            </Label>
            <Textarea
              id="thought"
              placeholder={t('reflections')}
              value={thought}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setThought(e.target.value)}
              className={cn(
                'w-full min-h-[88px] bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 p-3 text-sm focus:ring-indigo-500 transition-all resize-none text-zinc-900 dark:text-white font-medium',
                UI_CONSTANTS.buttonRadius
              )}
            />
          </div>

          <DialogFooter className="pt-1">
            <Button
              type="submit"
              disabled={isSubmitting || !actionName || !dateStr || !timeStr}
              className={cn(
                'w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 shadow-lg shadow-indigo-500/20 transition-transform active:scale-95 text-xs uppercase tracking-widest',
                UI_CONSTANTS.buttonRadius
              )}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('saveDeed')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
