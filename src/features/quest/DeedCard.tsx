import { Deed, PILLAR_COLORS, PILLAR_LABELS } from '@/types';
import { PILLAR_ICONS, UI_CONSTANTS } from '@/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, Clock, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuest } from './QuestProvider';

interface DeedCardProps {
  deed: Deed;
  onDelete?: (deed: Deed) => void;
  onEdit?: (deed: Deed) => void;
  className?: string;
  showThought?: boolean;
}

export function DeedCard({ deed, onDelete, onEdit, className, showThought = true }: DeedCardProps) {
  const { profile, t } = useQuest();
  const Icon = PILLAR_ICONS[deed.pillar];
  const lang = profile?.language || 'en';

  const handleCardActivate = () => {
    onEdit?.(deed);
  };

  return (
    <Card 
      className={cn(
        "relative bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 transition-all duration-300 overflow-hidden",
        onEdit && "cursor-pointer hover:border-indigo-400/50 dark:hover:border-indigo-500/40",
        UI_CONSTANTS.cardRadius,
        className
      )}
      role={onEdit ? 'button' : undefined}
      tabIndex={onEdit ? 0 : undefined}
      onClick={onEdit ? handleCardActivate : undefined}
      onKeyDown={
        onEdit
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardActivate();
              }
            }
          : undefined
      }
    >
      {onDelete && (
        <div className="absolute top-4 right-4 z-20">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(deed);
            }}
            className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-red-600 hover:bg-red-500/10 rounded-full"
            aria-label={t('delete')}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <CardContent className={cn("p-6 space-y-4", onDelete && 'pr-14')}>
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div 
              className={cn("w-12 h-12 shrink-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800", UI_CONSTANTS.iconRadius)}
            >
              <Icon className="w-6 h-6" style={{ color: PILLAR_COLORS[deed.pillar] }} />
            </div>
            <div className="flex flex-col min-w-0 flex-1 pr-2">
              <span
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: PILLAR_COLORS[deed.pillar] }}
              >
                {PILLAR_LABELS[lang][deed.pillar]}
              </span>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 break-words text-base leading-snug">
                {deed.actionName}
              </h3>
            </div>
          </div>
          <div className="text-[10px] font-black px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase tracking-tighter shrink-0 max-w-[40%] text-right break-all">
            {deed.feeling}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-tighter">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {deed.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {deed.time}
          </span>
          {deed.duration && (
            <span className="font-black" style={{ color: PILLAR_COLORS[deed.pillar] }}>
              {deed.duration} MIN
            </span>
          )}
        </div>

        {showThought && deed.thought && (
          <div className="relative">
            <Quote className="absolute -left-1 -top-1 w-3 h-3 text-zinc-200 dark:text-zinc-800 opacity-50" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 italic border-l-2 border-zinc-100 dark:border-zinc-800 pl-4 py-1 leading-relaxed">
              {deed.thought}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
