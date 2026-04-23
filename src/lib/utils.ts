import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, getWeek, getYear } from 'date-fns';

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

export function sumPillarObjectives(objectives: Record<string, number>): number {
  return Object.values(objectives).reduce((a, b) => a + (Number(b) || 0), 0);
}
