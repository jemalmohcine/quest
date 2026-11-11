import { cn } from '@/lib/utils';

/** Shared layout + surface classes (indigo/zinc palette only). */
export const questUi = {
  page: 'quest-page',
  card: 'quest-card',
  cardPad: 'p-4 md:p-5',
  kicker: 'text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400',
  title: 'text-xl font-black tracking-tight text-zinc-900 dark:text-white md:text-2xl',
  subtitle: 'text-xs font-medium text-zinc-600 dark:text-zinc-400',
  label: 'text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400',
  empty: 'quest-empty',
  navActive: 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400',
  control: 'min-h-11 touch-manipulation',
  shadow: 'shadow-[var(--ds-shadow-card)]',
  shadowSoft: 'shadow-sm shadow-black/5 dark:shadow-black/20',
  primaryBtn: 'quest-btn-primary',
  input: 'quest-input',
  segment: 'quest-segment',
  settingsTabActive:
    'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-indigo-400',
  settingsTabIdle: 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200',
} as const;

export function questSurfaceClass(extra?: string) {
  return cn('quest-card', questUi.shadowSoft, extra);
}

export function questCardClass(extra?: string) {
  return cn(questUi.card, extra);
}
