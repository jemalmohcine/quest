import type { Deed, Pillar } from '@/types';

export type ActionNameSuggestion = {
  actionName: string;
  pillar: Pillar;
  count: number;
  lastDate: string;
  lastTime: string;
};

/** One row per distinct action name; pillar comes from the most recent log. */
export function buildActionNameSuggestions(deeds: Deed[]): ActionNameSuggestion[] {
  const byKey = new Map<string, ActionNameSuggestion>();
  for (const d of deeds) {
    const trimmed = d.actionName.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        actionName: trimmed,
        pillar: d.pillar,
        count: 1,
        lastDate: d.date,
        lastTime: d.time,
      });
      continue;
    }
    existing.count += 1;
    const newer =
      d.date > existing.lastDate || (d.date === existing.lastDate && d.time > existing.lastTime);
    if (newer) {
      existing.lastDate = d.date;
      existing.lastTime = d.time;
      existing.pillar = d.pillar;
      existing.actionName = trimmed;
    }
  }
  return [...byKey.values()].sort(
    (a, b) => b.count - a.count || b.lastDate.localeCompare(a.lastDate) || b.lastTime.localeCompare(a.lastTime),
  );
}

export function filterActionNameSuggestions(
  all: ActionNameSuggestion[],
  opts: { pillar?: Pillar | null; query?: string; limit?: number },
): ActionNameSuggestion[] {
  const q = opts.query?.trim().toLowerCase() ?? '';
  let list = all;
  if (opts.pillar) {
    const scoped = list.filter((s) => s.pillar === opts.pillar);
    if (scoped.length > 0) list = scoped;
  }
  if (q) {
    list = list.filter((s) => s.actionName.toLowerCase().includes(q));
  }
  const limit = opts.limit ?? 8;
  return list.slice(0, limit);
}
