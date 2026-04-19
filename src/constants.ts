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
  cardRadius: 'rounded-[2rem]',
  buttonRadius: 'rounded-xl',
  inputRadius: 'rounded-xl',
  iconRadius: 'rounded-2xl',
};
