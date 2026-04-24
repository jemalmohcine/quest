import { Deed } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UI_CONSTANTS } from '@/constants';
import { cn } from '@/lib/utils';
import { useQuest } from './QuestProvider';

interface DeleteDeedDialogProps {
  deed: Deed | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteDeedDialog({ deed, onClose, onConfirm }: DeleteDeedDialogProps) {
  const { t } = useQuest();

  return (
    <Dialog open={!!deed} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 max-w-sm", UI_CONSTANTS.cardRadius)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-black tracking-tighter text-red-600 uppercase italic leading-none">
            {t('confirmDeed')}
          </DialogTitle>
          <DialogDescription className="font-medium text-zinc-500 py-4 leading-relaxed">
            Permanently delete <span className="text-zinc-900 dark:text-white font-bold">"{deed?.actionName}"</span>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
           <Button variant="ghost" onClick={onClose} className={cn("h-12 font-bold uppercase text-[10px] tracking-widest bg-zinc-100 dark:bg-zinc-800", UI_CONSTANTS.buttonRadius)}>{t('cancel') || 'Cancel'}</Button>
           <Button onClick={onConfirm} className={cn("bg-red-600 hover:bg-red-500 text-white h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-red-500/20", UI_CONSTANTS.buttonRadius)}>{t('delete') || 'Delete'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
