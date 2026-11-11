import type { DurationObjective, Pillar, UserProfile } from '@/types';
import { PILLARS } from '@/types';
import { durationToMinutes } from '@/lib/duration-units';
import { sumPillarObjectives } from '@/lib/utils';

/** Evidence tags for docs / release notes (not shown verbatim in UI). */
export const GOAL_PACK_RESEARCH_SOURCES = [
  'WHO 2020 guidelines on physical activity (≥150 min moderate activity per week for adults)',
  'Lally P, van Jaarsveld CHM, Potts HWW, Wardle J (2010). How are habits formed. European Journal of Social Psychology.',
  'Kabat-Zinn J. Mindfulness-based stress reduction (MBSR): commonly 10–45 min/day practice blocks.',
  'Dunbar RIM. Social brain hypothesis and maintenance of close relationships (~5 meaningful ties).',
  'Duckworth AL et al. Deliberate practice and skill development: short daily learning sessions compound.',
] as const;

export type GoalPackId = 'essential' | 'balanced' | 'momentum';

export const DEFAULT_GOAL_PACK_ID: GoalPackId = 'balanced';

export type GoalPackLocaleCopy = {
  name: string;
  tagline: string;
  summaryWhy: string;
  pillarWhy: Record<Pillar, string>;
};

export type GoalPackDefinition = {
  id: GoalPackId;
  deedsPerDay: Record<Pillar, number>;
  durationPerDay: Partial<Record<Pillar, DurationObjective>>;
  copy: Record<'en' | 'fr', GoalPackLocaleCopy>;
};

const essential: GoalPackDefinition = {
  id: 'essential',
  deedsPerDay: {
    soulset: 1,
    healthset: 1,
    mindset: 1,
    skillset: 1,
    heartset: 1,
  },
  durationPerDay: {
    soulset: { value: 10, unit: 'minutes' },
    healthset: { value: 22, unit: 'minutes' },
    mindset: { value: 10, unit: 'minutes' },
    skillset: { value: 15, unit: 'minutes' },
  },
  copy: {
    en: {
      name: 'Essential',
      tagline: 'For busy weeks when you need gentle structure without overload.',
      summaryWhy:
        'Built on small daily actions that match WHO minimum movement and habit research on starting with easy wins.',
      pillarWhy: {
        soulset: 'About 10 minutes of quiet or reflection supports habit anchoring.',
        healthset: '22 minutes a day keeps you near 150 minutes of movement each week.',
        mindset: 'A short daily check in helps mood and focus.',
        skillset: '15 minutes of focused practice is enough to learn steadily.',
        heartset: 'One intentional connection beat per day nurtures close ties.',
      },
    },
    fr: {
      name: 'Essentiel',
      tagline: 'Pour les semaines chargées, une structure douce sans surcharge.',
      summaryWhy:
        'Repère sur de petits gestes quotidiens, proche du minimum OMS et sur l’idée de commencer simple pour ancrer l’habitude.',
      pillarWhy: {
        soulset: 'Environ 10 minutes de recueil ou de respiration pour ancrer le rituel.',
        healthset: '22 minutes par jour rapprochent les 150 minutes de mouvement hebdomadaires.',
        mindset: 'Un court bilan chaque jour aide humeur et concentration.',
        skillset: '15 minutes de pratique ciblée suffisent pour progresser.',
        heartset: 'Un geste relationnel par jour entretient les liens proches.',
      },
    },
  },
};

const balanced: GoalPackDefinition = {
  id: 'balanced',
  deedsPerDay: {
    soulset: 2,
    healthset: 2,
    mindset: 2,
    skillset: 2,
    heartset: 2,
  },
  durationPerDay: {
    soulset: { value: 15, unit: 'minutes' },
    healthset: { value: 30, unit: 'minutes' },
    mindset: { value: 15, unit: 'minutes' },
    skillset: { value: 20, unit: 'minutes' },
  },
  copy: {
    en: {
      name: 'Balanced',
      tagline: 'For a steady rhythm across all five pillars.',
      summaryWhy:
        'Pairs WHO aligned activity with mindfulness style blocks and regular learning and connection time.',
      pillarWhy: {
        soulset: '15 minutes supports a real mindfulness or spiritual routine.',
        healthset: '30 minutes a day brings you above baseline WHO targets.',
        mindset: 'Two reflections a day deepen self awareness.',
        skillset: '20 minutes suits deliberate practice on skills.',
        heartset: 'Two social acts a day maintain your circle.',
      },
    },
    fr: {
      name: 'Équilibre',
      tagline: 'Pour un rythme stable sur les cinq piliers.',
      summaryWhy:
        'Combine activité proche des repères OMS, présence pleine, apprentissage et temps pour les proches.',
      pillarWhy: {
        soulset: '15 minutes pour une vraie pause spirituelle ou de pleine conscience.',
        healthset: '30 minutes par jour dépassent le socle OMS de façon durable.',
        mindset: 'Deux bilans quotidiens renforcent la clarté mentale.',
        skillset: '20 minutes pour une pratique délibérée sur vos compétences.',
        heartset: 'Deux actes relationnels par jour entretiennent votre cercle.',
      },
    },
  },
};

const momentum: GoalPackDefinition = {
  id: 'momentum',
  deedsPerDay: {
    soulset: 3,
    healthset: 3,
    mindset: 3,
    skillset: 3,
    heartset: 3,
  },
  durationPerDay: {
    soulset: { value: 20, unit: 'minutes' },
    healthset: { value: 45, unit: 'minutes' },
    mindset: { value: 25, unit: 'minutes' },
    skillset: { value: 30, unit: 'minutes' },
  },
  copy: {
    en: {
      name: 'Momentum',
      tagline: 'For ambitious seasons when you want higher daily volume.',
      summaryWhy:
        'Higher deed counts and durations for users who already build habits and want strong weekly totals.',
      pillarWhy: {
        soulset: '20 minutes for deeper spiritual or meditation work.',
        healthset: '45 minutes a day drives strong cardiovascular weekly volume.',
        mindset: 'Three mindset reps for heavy thinking or journaling days.',
        skillset: '30 minutes matches intense deliberate practice blocks.',
        heartset: 'Three connection beats to actively widen your network.',
      },
    },
    fr: {
      name: 'Élan',
      tagline: 'Pour les périodes où vous voulez plus de volume chaque jour.',
      summaryWhy:
        'Plus d’actes et de durées pour celles et ceux qui ont déjà des habitudes et visent de gros totaux hebdo.',
      pillarWhy: {
        soulset: '20 minutes pour un travail spirituel ou méditatif plus profond.',
        healthset: '45 minutes par jour pour un volume cardio hebdomadaire élevé.',
        mindset: 'Trois passages mindset pour journées de réflexion ou journal.',
        skillset: '30 minutes pour des blocs de pratique délibérée intenses.',
        heartset: 'Trois gestes relationnels pour nourrir activement votre réseau.',
      },
    },
  },
};

export const GOAL_PACKS: GoalPackDefinition[] = [essential, balanced, momentum];

export const GOAL_PACK_IDS: GoalPackId[] = GOAL_PACKS.map((p) => p.id);

export function getGoalPack(id: GoalPackId): GoalPackDefinition {
  const pack = GOAL_PACKS.find((p) => p.id === id);
  if (!pack) throw new Error(`Unknown goal pack: ${id}`);
  return pack;
}

export function goalPackToProfileSettings(
  packId: GoalPackId,
): Pick<UserProfile, 'objectivePerPillar' | 'durationObjectivePerPillar' | 'dailyObjective' | 'goalPackId'> {
  const pack = getGoalPack(packId);
  const durationObjectivePerPillar: Partial<Record<Pillar, DurationObjective>> = {};
  for (const p of PILLARS) {
    if (p === 'heartset') continue;
    const d = pack.durationPerDay[p];
    if (d) durationObjectivePerPillar[p] = { ...d };
  }
  return {
    goalPackId: packId,
    objectivePerPillar: { ...pack.deedsPerDay },
    durationObjectivePerPillar,
    dailyObjective: sumPillarObjectives(pack.deedsPerDay),
  };
}

function durationObjectiveEqual(
  a: DurationObjective | undefined,
  b: DurationObjective | undefined,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.value === b.value && a.unit === b.unit;
}

export function profileMatchesGoalPack(profile: UserProfile, packId: GoalPackId): boolean {
  const pack = getGoalPack(packId);
  for (const p of PILLARS) {
    if ((profile.objectivePerPillar[p] ?? 0) !== pack.deedsPerDay[p]) return false;
    if (p === 'heartset') {
      if (profile.durationObjectivePerPillar?.heartset) return false;
      continue;
    }
    const expected = pack.durationPerDay[p];
    const actual = profile.durationObjectivePerPillar?.[p];
    if (!durationObjectiveEqual(actual, expected)) return false;
  }
  return true;
}

export function detectMatchingGoalPack(profile: UserProfile): GoalPackId | null {
  for (const id of GOAL_PACK_IDS) {
    if (profileMatchesGoalPack(profile, id)) return id;
  }
  return null;
}

/** True for pre-pack default profile (1 deed/pillar, no durations, total 5). */
export function isLegacyDefaultGoals(
  profile: Pick<UserProfile, 'objectivePerPillar' | 'durationObjectivePerPillar' | 'dailyObjective'>,
): boolean {
  if (profile.dailyObjective !== 5) return false;
  for (const p of PILLARS) {
    if ((profile.objectivePerPillar[p] ?? 0) !== 1) return false;
  }
  const durations = profile.durationObjectivePerPillar;
  if (!durations) return true;
  for (const p of PILLARS) {
    if (p === 'heartset') continue;
    const d = durations[p];
    if (d && d.value > 0) return false;
  }
  return true;
}

/** Selected pack for UI: only persisted goalPackId when it still matches objectives. */
export function resolveDisplayedGoalPack(
  profile: UserProfile | null | undefined,
  opts?: { treatAsCustom?: boolean },
): GoalPackId | 'custom' | null {
  if (!profile || opts?.treatAsCustom) return 'custom';
  const id = profile.goalPackId;
  if (!id) return 'custom';
  return profileMatchesGoalPack(profile, id) ? id : 'custom';
}

/** Weekly deed target (Mon–Sun) for display on pack cards. */
export function weeklyDeedTarget(packId: GoalPackId, pillar: Pillar): number {
  return getGoalPack(packId).deedsPerDay[pillar] * 7;
}

export function weeklyDurationMinutes(packId: GoalPackId, pillar: Pillar): number {
  const pack = getGoalPack(packId);
  if (pillar === 'heartset') return 0;
  const d = pack.durationPerDay[pillar];
  if (!d) return 0;
  return durationToMinutes(d.value, d.unit) * 7;
}
