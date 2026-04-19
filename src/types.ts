import { Timestamp } from 'firebase/firestore';

export type Pillar = 'soulset' | 'healthset' | 'mindset' | 'skillset' | 'heartset';

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
  createdAt: Timestamp;
  language: 'en' | 'fr';
  theme: 'light' | 'dark' | 'system';
  dailyObjective: number;
  objectivePerPillar: Record<Pillar, number>;
  photoURL?: string;
}

export interface Deed {
  id?: string;
  pillar: Pillar;
  actionName: string;
  duration?: number | null;
  thought?: string | null;
  feeling: Feeling;
  createdAt: Timestamp;
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
  'focused'
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
  }
};
