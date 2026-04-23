import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, getWeek, getYear } from 'date-fns';
import { PILLARS, type Pillar } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, _formatStr: string = 'MMM dd, yyyy') {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return date.toString();
  }
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Generates consistent metadata for a new deed entry
 */
export function createDeedMetadata() {
  const now = new Date();
  return {
    date: format(now, 'yyyy-MM-dd'),
    week: getWeek(now),
    month: format(now, 'yyyy-MM'),
    year: now.getFullYear(),
    time: format(now, 'HH:mm'),
  };
}

/** Recalcule date / semaine / mois / année / heure à partir des champs édités (date locale). */
export function deedFieldsFromDateAndTime(dateStr: string, timeStr: string) {
  const [y, mo, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  const [hh, mm] = timeStr.split(':').map((n) => parseInt(n, 10));
  const when = new Date(y, mo - 1, d, hh || 0, mm || 0, 0, 0);
  return {
    date: dateStr,
    week: getWeek(when),
    month: format(when, 'yyyy-MM'),
    year: getYear(when),
    time: `${String(hh || 0).padStart(2, '0')}:${String(mm || 0).padStart(2, '0')}`,
  };
}

/** Somme des objectifs quotidiens par pilier (toujours les 5 piliers, manquant = 0). */
export function sumPillarObjectives(
  objectives: Partial<Record<Pillar, number>> | Record<string, number> | undefined | null
): number {
  if (!objectives) return 0;
  return PILLARS.reduce((sum, p) => {
    const n = Number((objectives as Record<string, number>)[p]);
    return sum + (Number.isNaN(n) ? 0 : Math.max(0, Math.min(99, n)));
  }, 0);
}

/** Total « actes pour 100 % » : somme des objectifs par pilier depuis les réglages, sinon `dailyObjective`. */
export function dailyTargetFromProfile(
  profile: { objectivePerPillar?: Partial<Record<Pillar, number>> | null; dailyObjective?: number } | null | undefined
): number {
  if (!profile) return 5;
  const fromPillars = sumPillarObjectives(profile.objectivePerPillar ?? undefined);
  if (fromPillars > 0) return fromPillars;
  const d = profile.dailyObjective;
  if (typeof d === 'number' && d > 0) return d;
  return 5;
}

export function pillarDailyTarget(
  profile: { objectivePerPillar?: Partial<Record<Pillar, number>> | null } | null | undefined,
  pillar: Pillar
): number {
  const v = profile?.objectivePerPillar?.[pillar];
  if (typeof v === 'number' && !Number.isNaN(v)) return Math.min(99, Math.max(0, v));
  return 1;
}

/**
 * Actes qui comptent pour la journée : par pilier, min(nb d'actes, objectif du pilier).
 * Les actes en trop dans un pilier ne font pas monter les autres.
 */
export function effectiveDeedsTowardDaily(
  profile: { objectivePerPillar?: Partial<Record<Pillar, number>> | null; dailyObjective?: number } | null | undefined,
  todayDeeds: { pillar: Pillar }[]
): number {
  const pillarSum = sumPillarObjectives(profile?.objectivePerPillar ?? undefined);
  const target = dailyTargetFromProfile(profile);
  if (pillarSum <= 0) {
    return Math.min(todayDeeds.length, target);
  }
  let acc = 0;
  for (const p of PILLARS) {
    const t = pillarDailyTarget(profile, p);
    if (t <= 0) continue;
    const c = todayDeeds.filter((d) => d.pillar === p).length;
    acc += Math.min(c, t);
  }
  return acc;
}

export function dailyProgressBreakdown(
  profile: { objectivePerPillar?: Partial<Record<Pillar, number>> | null; dailyObjective?: number } | null | undefined,
  todayDeeds: { pillar: Pillar }[]
): { effective: number; target: number; percent: number } {
  const target = dailyTargetFromProfile(profile);
  const effective = effectiveDeedsTowardDaily(profile, todayDeeds);
  const percent = Math.min(100, Math.round((effective / Math.max(target, 1)) * 100));
  return { effective, target, percent };
}
