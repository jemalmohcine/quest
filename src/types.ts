import type { DurationUnit } from '@/lib/duration-units';
import type { GoalPackId } from '@/lib/goal-packs';

export type { GoalPackId };

export type Pillar = 'soulset' | 'healthset' | 'mindset' | 'skillset' | 'heartset';

export interface DurationObjective {
  value: number;
  unit: DurationUnit;
}

export type Feeling =
  | 'happy'
  | 'confident'
  | 'frustrated'
  | 'neutral'
  | 'energized'
  | 'calm'
  | 'motivated'
  | 'peaceful'
  | 'tired'
  | 'focused';

export interface UserProfile {
  email: string;
  name: string;
  createdAt: string;
  language: 'en' | 'fr';
  theme: 'light' | 'dark' | 'system';
  /** Somme des objectifs par pilier (affichage / compat). */
  dailyObjective: number;
  /** Nombre d'actes visés par jour, par pilier. */
  objectivePerPillar: Record<Pillar, number>;
  /** Durée visée par jour (minutes normalisées côté stats), par pilier. */
  durationObjectivePerPillar?: Partial<Record<Pillar, DurationObjective>>;
  /** Sentiments supplémentaires saisis par l'utilisateur (slug lowercase). */
  customFeelings?: string[];
  photoURL?: string;
  /** Preset pack last applied, null if goals are custom. */
  goalPackId?: GoalPackId | null;
}

export interface Deed {
  id?: string;
  user_id?: string;
  pillar: Pillar;
  actionName: string;
  /** Legacy rounded minutes (kept in sync with durationSeconds). */
  duration?: number | null;
  /** Canonical stored duration in seconds. */
  durationSeconds?: number | null;
  /** Unit the user chose when logging (for display and edit prefills). */
  durationUnit?: DurationUnit | string | null;
  thought?: string | null;
  /** Préréglages + sentiments personnalisés du profil. */
  feeling: string;
  /** Horodatage ISO côté Supabase (`created_at`). */
  createdAt?: string;
  date: string; // YYYY-MM-DD
  week: number;
  month: string; // YYYY-MM
  year: number;
  time: string; // HH:MM
}

export const PILLARS: Pillar[] = ['soulset', 'healthset', 'mindset', 'skillset', 'heartset'];

export const FEELINGS: Feeling[] = [
  'happy',
  'confident',
  'frustrated',
  'neutral',
  'energized',
  'calm',
  'motivated',
  'peaceful',
  'tired',
  'focused',
];

export const PILLAR_COLORS: Record<Pillar, string> = {
  soulset: '#8b5cf6', // Purple
  healthset: '#22c55e', // Green
  mindset: '#3b82f6', // Blue
  skillset: '#f97316', // Orange
  heartset: '#ec4899', // Pink
};

export const PILLAR_LABELS: Record<string, Record<Pillar, string>> = {
  en: {
    soulset: 'Soulset',
    healthset: 'Healthset',
    mindset: 'Mindset',
    skillset: 'Skillset',
    heartset: 'Heartset',
  },
  fr: {
    soulset: 'Soulset',
    healthset: 'Healthset',
    mindset: 'Mindset',
    skillset: 'Skillset',
    heartset: 'Heartset',
  },
};
