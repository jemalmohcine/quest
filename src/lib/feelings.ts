import type { UserProfile } from '../types';
import { FEELINGS } from '../types';

export function normalizeFeelingKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '_');
}

export function allFeelingOptions(profile: UserProfile | null | undefined): string[] {
  const custom = profile?.customFeelings ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of [...FEELINGS, ...custom.map(normalizeFeelingKey).filter(Boolean)]) {
    if (!seen.has(f)) {
      seen.add(f);
      out.push(f);
    }
  }
  return out;
}
