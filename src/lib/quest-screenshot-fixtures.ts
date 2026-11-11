/**
 * Données figées pour captures UI (NEXT_PUBLIC_QUEST_SCREENSHOT_FIXTURES=1 uniquement).
 * Aucun impact hors mode capture / dev.
 */
import { format, subDays } from 'date-fns';
import { goalPackToProfileSettings, DEFAULT_GOAL_PACK_ID } from '@/lib/goal-packs';
import type { UserProfile } from '@/types';

export function isQuestScreenshotFixtureMode(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.NEXT_PUBLIC_QUEST_SCREENSHOT_FIXTURES === '1';
}

const USER_ID = 'screenshot-fixture-user';

export const SCREENSHOT_MOCK_PROFILE: UserProfile = {
  email: 'capture@quest.dev',
  name: 'Mohcine',
  createdAt: new Date().toISOString(),
  language: 'fr',
  theme: 'system',
  customFeelings: [],
  ...goalPackToProfileSettings(DEFAULT_GOAL_PACK_ID),
};

export function screenshotProfileApiRow() {
  const p = SCREENSHOT_MOCK_PROFILE;
  return {
    user_id: USER_ID,
    email: p.email,
    name: p.name,
    language: p.language,
    theme: p.theme,
    daily_objective: p.dailyObjective,
    objective_per_pillar: p.objectivePerPillar,
    duration_objective_per_pillar: p.durationObjectivePerPillar ?? {},
    custom_feelings: p.customFeelings ?? [],
    photo_url: null,
    goal_pack_id: p.goalPackId ?? DEFAULT_GOAL_PACK_ID,
  };
}

function deedRow(
  id: string,
  pillar: string,
  actionName: string,
  offsetDays: number,
  opts?: { thought?: string; duration?: number; feeling?: string },
) {
  const d = subDays(new Date(), offsetDays);
  const date = format(d, 'yyyy-MM-dd');
  const time = format(d, 'HH:mm');
  return {
    id,
    user_id: USER_ID,
    pillar,
    action_name: actionName,
    duration: opts?.duration ?? 15,
    duration_seconds: (opts?.duration ?? 15) * 60,
    duration_unit: 'minutes',
    thought: opts?.thought ?? null,
    feeling: opts?.feeling ?? 'happy',
    date,
    time,
    week: 45,
    month: format(d, 'yyyy-MM'),
    year: d.getFullYear(),
    created_at: d.toISOString(),
  };
}

export const SCREENSHOT_MOCK_DEEDS = [
  deedRow('d1', 'soulset', 'Méditation matinale', 0, { thought: 'Sérénité avant la journée.', duration: 10 }),
  deedRow('d2', 'healthset', 'Course rapide', 0, { duration: 25, feeling: 'energized' }),
  deedRow('d3', 'mindset', 'Journal gratitude', 0, { thought: 'Trois victoires notées.', duration: 5 }),
  deedRow('d4', 'skillset', 'Lecture technique', 0, { duration: 30 }),
  deedRow('d5', 'heartset', 'Message à un ami', 0, { feeling: 'grateful' }),
  deedRow('d6', 'healthset', 'Étirements', 1, { duration: 12 }),
  deedRow('d7', 'soulset', 'Prière / intention', 2, { duration: 8 }),
  deedRow('d8', 'skillset', 'Exercice langue', 3, { duration: 20, thought: '20 min sur les verbes.' }),
  deedRow('d9', 'mindset', 'Marche consciente', 4, { duration: 15 }),
  deedRow('d10', 'heartset', 'Cuisine partagée', 5, { feeling: 'happy' }),
  deedRow('d11', 'healthset', 'Musculation', 6, { duration: 40 }),
  deedRow('d12', 'soulset', 'Lecture spirituelle', 7, { duration: 18 }),
];

export function filterScreenshotDeeds(params?: {
  date?: string;
  recent?: number;
  limit?: number;
}): unknown[] {
  let rows = [...SCREENSHOT_MOCK_DEEDS];
  if (params?.date) {
    rows = rows.filter((r) => r.date === params.date);
  }
  if (params?.recent != null) {
    rows = rows.slice(0, params.recent);
  }
  if (params?.limit != null) {
    rows = rows.slice(0, params.limit);
  }
  return rows;
}

export const SCREENSHOT_MOCK_RESUME_MARKDOWN = `## Résumé de la semaine

Tu as **maintenu un rythme régulier** sur les cinq piliers : plus d'efforts sur **healthset** et **skillset**, avec des pensées claires sur **mindset**.

- **Point fort** : constance sur les actes courts (méditation, gratitude).
- **Piste** : un peu plus de **heartset** cette semaine.

*Capture illustrative — données mock.*`;
