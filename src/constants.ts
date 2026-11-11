import { Sparkles, Dumbbell, Brain, Target, Heart } from 'lucide-react';
import { Pillar } from './types';

export const PILLAR_ICONS: Record<Pillar, any> = {
  soulset: Sparkles,
  healthset: Dumbbell,
  mindset: Brain,
  skillset: Target,
  heartset: Heart,
};

export const UI_CONSTANTS = {
  cardRadius: 'rounded-2xl',
  buttonRadius: 'rounded-xl',
  inputRadius: 'rounded-xl',
  iconRadius: 'rounded-xl',
};

/** Mobile shell: bottom nav + FAB column + progress widget (safe-area aware). */
export const MOBILE_SHELL = {
  /** Space reserved at bottom of scrollable main on <md */
  mainPaddingBottom:
    'pb-[calc(9.25rem+env(safe-area-inset-bottom,0px))] md:pb-8',
  /** Fixed FAB stack (mic + log) above bottom nav */
  fabBottom:
    'bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))]',
  /** Progress / timer widget — left side, below FABs vertically */
  widgetBottom:
    'bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]',
} as const;
