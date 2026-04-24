import { useState, useEffect } from 'react';
import { useQuest } from './QuestProvider';
import { questHttp } from '@/services/quest-http';
import { Deed, PILLARS, Pillar, PILLAR_LABELS } from '@/types';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { deedFieldsFromDateAndTime } from '@/lib/utils';
import { allFeelingOptions } from '@/lib/feelings';
import { UI_CONSTANTS } from '@/constants';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { enUS, fr } from 'date-fns/locale';
import { DeedDateTimeComboField } from './DeedDateTimeFields';
import { useDeedsRefreshStore } from '@/stores';

interface EditDeedDialogProps {
  deed: Deed | null;
  onClose: () => void;
}

export function EditDeedDialog({ deed, onClose }: EditDeedDialogProps) {
  const { profile, t } = useQuest();
  const lang = profile?.language || 'en';
  const dateLocale = lang === 'fr' ? fr : enUS;
  const [actionName, setActionName] = useState('');
  const [pillar, setPillar] = useState<Pillar>('soulset');
  const [duration, setDuration] = useState('');
  const [feeling, setFeeling] = useState('');
  const [thought, setThought] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!deed) return;
    setActionName(deed.actionName);
    setPillar(deed.pillar);
    setDuration(deed.duration != null ? String(deed.duration) : '');
    setFeeling(deed.feeling);
    setThought(deed.thought || '');
    setDateStr(deed.date);
    setTimeStr(deed.time);
  }, [deed]);

  const baseChoices = allFeelingOptions(profile ?? null);
  const feelingChoices = feeling && !baseChoices.includes(feeling) ? [feeling, ...baseChoices] : baseChoices;

  const handleSave = async () => {
    if (!deed?.id || !actionName.trim()) return;
    setSaving(true);
    try {
      const meta = deedFieldsFromDateAndTime(dateStr, timeStr);
      const [y, mo, d] = dateStr.split('-').map((n) => parseInt(n, 10));
      const [hh, mi] = timeStr.split(':').map((n) => parseInt(n, 10));
      const when = new Date(y, mo - 1, d, hh || 0, mi || 0, 0, 0);

      const payload: Record<string, unknown> = {
        action_name: actionName.trim(),
        pillar,
        feeling: (feeling.trim() || 'neutral').toLowerCase(),
        thought: thought.trim() || null,
        ...meta,
        created_at: when.toISOString(),
      };
      if (duration.trim()) {
        const du = parseInt(duration, 10);
        payload.duration = Number.isNaN(du) ? null : Math.max(0, du);
      } else {
        payload.duration = null;
      }

      const { error } = await questHttp.updateDeed(deed.id, payload);
      if (error) throw new Error(error.message);
      useDeedsRefreshStore.getState().bumpDeedsRefresh();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!deed} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 sm:max-w-md sm:overflow-visible max-h-[90vh] overflow-y-auto',
          UI_CONSTANTS.cardRadius,
        )}
      >
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-tight text-lg">{t('editDeed')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400">{t('actionName')}</Label>
            <Input value={actionName} onChange={(e) => setActionName(e.target.value)} className={cn('font-semibold', UI_CONSTANTS.buttonRadius)} />
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400">{t('pillar')}</Label>
              <Select value={pillar} onValueChange={(v) => v && setPillar(v as Pillar)}>
                <SelectTrigger className={cn('w-full', UI_CONSTANTS.buttonRadius)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  {PILLARS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PILLAR_LABELS[lang][p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400">{t('duration')}</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className={cn('w-full', UI_CONSTANTS.buttonRadius)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400">{t('feeling')}</Label>
            <Select value={feeling} onValueChange={(v) => v && setFeeling(v)}>
              <SelectTrigger className={UI_CONSTANTS.buttonRadius}>
                <SelectValue placeholder={t('feeling')} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 max-h-48">
                {feelingChoices.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400">{t('thought')}</Label>
            <Textarea value={thought} onChange={(e) => setThought(e.target.value)} rows={3} className={cn('resize-none', UI_CONSTANTS.buttonRadius)} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving} className={UI_CONSTANTS.buttonRadius}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !actionName.trim()}
            className={cn('bg-indigo-600 text-white', UI_CONSTANTS.buttonRadius)}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
