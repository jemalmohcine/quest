import { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { db, collection, addDoc, Timestamp, handleFirestoreError, OperationType, query, orderBy, limit, onSnapshot } from '../lib/firebase';
import { PILLARS, FEELINGS, PILLAR_LABELS, Pillar, Feeling } from '../types';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { cn, createDeedMetadata } from '../lib/utils';
import { UI_CONSTANTS } from '../constants';
import { Loader2, Sparkles } from 'lucide-react';

interface AddDeedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDeedModal({ isOpen, onClose }: AddDeedModalProps) {
  const { user, profile, t } = useFirebase();
  const [pillar, setPillar] = useState<Pillar>('soulset');
  const [actionName, setActionName] = useState('');
  const [duration, setDuration] = useState('');
  const [thought, setThought] = useState('');
  const [feeling, setFeeling] = useState<Feeling>('happy');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<Record<string, { count: number; lastDuration: string; lastFeeling: Feeling; pillar: Pillar }>>({});

  useEffect(() => {
    if (!user || !isOpen) return;

    const deedsRef = collection(db, 'users', user.uid, 'deeds');
    const q = query(deedsRef, orderBy('createdAt', 'desc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stats: Record<string, { count: number; lastDuration: string; lastFeeling: Feeling; pillar: Pillar }> = {};
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const key = `${data.pillar}:${data.actionName}`;
        if (!stats[key]) {
          stats[key] = { 
            count: 0, 
            lastDuration: data.duration?.toString() || '', 
            lastFeeling: data.feeling || 'happy',
            pillar: data.pillar as Pillar
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
      heartset: ['Call Family', 'Active Listening', 'Volunteer Work', 'Kind Gesture', 'Date Night']
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
    if (!user || !actionName) return;

    setIsSubmitting(true);
    const path = `users/${user.uid}/deeds`;
    try {
      const deedData: any = {
        pillar,
        actionName,
        feeling,
        createdAt: Timestamp.now(),
        ...createDeedMetadata()
      };

      if (duration) {
        deedData.duration = parseInt(duration);
      }
      if (thought) {
        deedData.thought = thought;
      }

      await addDoc(collection(db, 'users', user.uid, 'deeds'), deedData);
      
      // Reset form
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
      <DialogContent className={cn("bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white sm:max-w-[425px] p-0 overflow-hidden", UI_CONSTANTS.cardRadius)}>
        <div className="bg-indigo-600 p-6 flex items-center gap-4">
          <div className={cn("w-12 h-12 bg-white/20 flex items-center justify-center backdrop-blur-sm", UI_CONSTANTS.buttonRadius)}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-white tracking-tight leading-none">{t('logDeed')}</DialogTitle>
            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1">{t('logDeedTagline')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pillar" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t('pillar')} *</Label>
              <Select value={pillar} onValueChange={(v: string | null) => v && setPillar(v as Pillar)}>
                <SelectTrigger className={cn("bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 h-11 focus:ring-indigo-500 text-zinc-900 dark:text-white font-bold", UI_CONSTANTS.buttonRadius)}>
                  <SelectValue placeholder={t('pillar')} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white">
                  {PILLARS.map((p) => (
                    <SelectItem key={p} value={p} className="focus:bg-indigo-600 focus:text-white font-bold">
                      {PILLAR_LABELS[profile?.language || 'en'][p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feeling" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t('feeling')} *</Label>
              <Select value={feeling} onValueChange={(v: string | null) => v && setFeeling(v as Feeling)}>
                <SelectTrigger className={cn("bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 h-11 focus:ring-indigo-500 text-zinc-900 dark:text-white font-bold", UI_CONSTANTS.buttonRadius)}>
                  <SelectValue placeholder={t('feeling')} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white">
                  {FEELINGS.map((f) => (
                    <SelectItem key={f} value={f} className="capitalize focus:bg-indigo-600 focus:text-white font-bold">
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="action" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t('actionName')} *</Label>
              <Input
                id="action"
                placeholder={t('whatAccomplished')}
                value={actionName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActionName(e.target.value)}
                required
                className={cn("bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 h-11 focus:ring-indigo-500 text-zinc-900 dark:text-white font-bold", UI_CONSTANTS.buttonRadius)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {currentSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all active:scale-95",
                    actionName === suggestion
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t('duration')}</Label>
            <Input
              id="duration"
              type="number"
              placeholder="e.g. 30"
              value={duration}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDuration(e.target.value)}
              className={cn("bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 h-11 focus:ring-indigo-500 text-zinc-900 dark:text-white font-bold", UI_CONSTANTS.buttonRadius)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thought" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t('thought')}</Label>
            <Textarea
              id="thought"
              placeholder={t('reflections')}
              value={thought}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setThought(e.target.value)}
              className={cn("w-full min-h-[100px] bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 p-3 text-sm focus:ring-indigo-500 transition-all resize-none text-zinc-900 dark:text-white font-medium", UI_CONSTANTS.buttonRadius)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button 
              type="submit" 
              disabled={isSubmitting || !actionName}
              className={cn("w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-14 shadow-lg shadow-indigo-500/20 transition-transform active:scale-95 text-xs uppercase tracking-widest", UI_CONSTANTS.buttonRadius)}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('saveDeed')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
