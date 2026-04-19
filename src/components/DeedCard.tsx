import { Deed, PILLAR_COLORS, PILLAR_LABELS } from '../types';
import { PILLAR_ICONS, UI_CONSTANTS } from '../constants';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Trash2, Calendar, Clock, Quote } from 'lucide-react';
import { cn } from '../lib/utils';
import { useFirebase } from './FirebaseProvider';

interface DeedCardProps {
  deed: Deed;
  onDelete?: (deed: Deed) => void;
  className?: string;
  showThought?: boolean;
}

export function DeedCard({ deed, onDelete, className, showThought = true }: DeedCardProps) {
  const { profile } = useFirebase();
  const Icon = PILLAR_ICONS[deed.pillar];
  const lang = profile?.language || 'en';

  return (
    <Card 
      className={cn(
        "relative bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/30 transition-all duration-300 group overflow-hidden",
        UI_CONSTANTS.cardRadius,
        className
      )}
    >
      {onDelete && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onDelete(deed)}
          className="absolute top-4 right-4 h-8 w-8 text-zinc-300 hover:text-red-500 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
      
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className={cn("w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform bg-zinc-100 dark:bg-zinc-800", UI_CONSTANTS.iconRadius)}
            >
              <Icon className="w-6 h-6" style={{ color: PILLAR_COLORS[deed.pillar] }} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {PILLAR_LABELS[lang][deed.pillar]}
              </span>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate w-40 sm:w-auto overflow-hidden">
                {deed.actionName}
              </h3>
            </div>
          </div>
          <div className="text-[10px] font-black px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase tracking-tighter mr-8 shrink-0">
            {deed.feeling}
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {deed.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {deed.time}
          </span>
          {deed.duration && (
            <span className="text-indigo-600 dark:text-indigo-400 font-black">{deed.duration} MIN</span>
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
