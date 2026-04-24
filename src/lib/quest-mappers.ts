import type { UserProfile, Deed, Pillar } from '../types';
import { PILLARS } from '../types';

type ProfileRow = {
  id: string;
  email: string;
  name: string;
  language: string;
  theme: string;
  daily_objective: number;
  objective_per_pillar: Record<string, number>;
  custom_feelings: string[];
  photo_url?: string | null;
  created_at?: string;
};

export function profileRowToUserProfile(row: ProfileRow): UserProfile {
  const opp = row.objective_per_pillar ?? {};
  const objectivePerPillar = PILLARS.reduce(
    (acc, p) => {
      const n = Number(opp[p]);
      acc[p] = Number.isNaN(n) ? 1 : Math.max(0, Math.min(99, n));
      return acc;
    },
    {} as Record<Pillar, number>,
  );
  return {
    email: row.email,
    name: row.name,
    createdAt: row.created_at ?? new Date().toISOString(),
    language: row.language === 'fr' ? 'fr' : 'en',
    theme: row.theme === 'dark' || row.theme === 'light' || row.theme === 'system' ? row.theme : 'system',
    dailyObjective: row.daily_objective ?? 5,
    objectivePerPillar,
    customFeelings: Array.isArray(row.custom_feelings) ? row.custom_feelings : [],
    photoURL: row.photo_url ?? undefined,
  };
}

export function userProfileToUpsertRow(
  id: string,
  email: string,
  profile: UserProfile,
): ProfileRow {
  return {
    id,
    email: email || profile.email,
    name: profile.name,
    language: profile.language,
    theme: profile.theme,
    daily_objective: profile.dailyObjective,
    objective_per_pillar: profile.objectivePerPillar,
    custom_feelings: profile.customFeelings ?? [],
    photo_url: profile.photoURL ?? null,
  };
}

type DeedRow = {
  id: string;
  user_id: string;
  pillar: string;
  action_name: string;
  duration: number | null;
  thought: string | null;
  feeling: string;
  date: string;
  time: string;
  week: number;
  month: string;
  year: number;
  created_at?: string;
};

export function deedRowToDeed(row: DeedRow): Deed {
  return {
    id: row.id,
    user_id: row.user_id,
    pillar: row.pillar as Pillar,
    actionName: row.action_name,
    duration: row.duration,
    thought: row.thought,
    feeling: row.feeling ?? 'neutral',
    date: row.date,
    time: row.time,
    week: row.week,
    month: row.month,
    year: row.year,
    createdAt: row.created_at,
  };
}

export function mapDeedRows(rows: unknown[] | null): Deed[] {
  if (!rows?.length) return [];
  return rows.map((r) => deedRowToDeed(r as DeedRow));
}
