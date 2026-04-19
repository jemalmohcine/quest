import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, getWeek } from 'date-fns';

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
