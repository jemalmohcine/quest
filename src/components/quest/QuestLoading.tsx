import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { questUi } from '@/lib/quest-ui';

export function QuestLoading({ label, className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn('flex min-h-[8rem] flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-7 w-7 animate-spin text-indigo-600 dark:text-indigo-400" />
      {label ? <p className={questUi.subtitle}>{label}</p> : null}
    </div>
  );
}
