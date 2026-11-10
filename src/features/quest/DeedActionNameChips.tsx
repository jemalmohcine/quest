import { cn } from '@/lib/utils';
import { UI_CONSTANTS } from '@/constants';
import type { ActionNameSuggestion } from '@/lib/deed-name-suggestions';

type Props = {
  suggestions: ActionNameSuggestion[];
  selectedName: string;
  onPick: (s: ActionNameSuggestion) => void;
  disabled?: boolean;
  className?: string;
};

export function DeedActionNameChips({ suggestions, selectedName, onPick, disabled, className }: Props) {
  if (!suggestions.length) return null;

  return (
    <div
      className={cn(
        '-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-0.5 [-webkit-overflow-scrolling:touch]',
        className,
      )}
    >
      {suggestions.map((s) => {
        const active = selectedName.trim().toLowerCase() === s.actionName.toLowerCase();
        return (
          <button
            key={`${s.pillar}:${s.actionName}`}
            type="button"
            disabled={disabled}
            onClick={() => onPick(s)}
            className={cn(
              'min-h-11 shrink-0 touch-manipulation rounded-full border px-4 py-2.5 text-[10px] font-bold transition-all active:scale-95',
              active
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-zinc-200 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
              UI_CONSTANTS.buttonRadius,
            )}
          >
            {s.actionName}
          </button>
        );
      })}
    </div>
  );
}
