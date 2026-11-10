import type { Deed, Pillar, UserProfile } from '@/types';
import { PILLARS } from '@/types';
import { formatDeedDurationPhrase, getDeedDurationMinutes } from '@/lib/duration-units';
import {
  periodDeedTarget,
  periodDurationTargetMinutes,
} from '@/lib/objectives';
import type { TranslationKey } from '@/lib/translations';
import type { ResumeScope } from '@/lib/resume-periods';

export type ResumeAggregation = {
  deedCount: number;
  deeds: Deed[];
  deedsByPillar: Record<Pillar, number>;
  minutesByPillar: Record<Pillar, number>;
  feelings: Record<string, number>;
  thoughts: { date: string; pillar: Pillar; actionName: string; text: string }[];
  pillarsWithThoughts: Pillar[];
};

export function aggregateDeedsForResume(
  deeds: Deed[],
  scope: ResumeScope,
  _dayCount: number,
  _profile?: UserProfile | null | undefined,
): ResumeAggregation {
  const filtered =
    scope === 'global' ? deeds : deeds.filter((d) => d.pillar === scope);

  const deedsByPillar = PILLARS.reduce(
    (acc, p) => {
      acc[p] = filtered.filter((d) => d.pillar === p).length;
      return acc;
    },
    {} as Record<Pillar, number>,
  );

  const minutesByPillar = PILLARS.reduce(
    (acc, p) => {
      acc[p] = filtered.filter((d) => d.pillar === p).reduce((sum, d) => sum + getDeedDurationMinutes(d), 0);
      return acc;
    },
    {} as Record<Pillar, number>,
  );

  const feelings: Record<string, number> = {};
  for (const d of filtered) {
    feelings[d.feeling] = (feelings[d.feeling] || 0) + 1;
  }

  const thoughts = filtered
    .filter((d) => d.thought?.trim())
    .map((d) => ({
      date: d.date,
      pillar: d.pillar,
      actionName: d.actionName,
      text: String(d.thought).trim(),
    }));

  const pillarsWithThoughts = PILLARS.filter((p) =>
    filtered.some((d) => d.pillar === p && d.thought?.trim()),
  );

  return {
    deedCount: filtered.length,
    deeds: filtered,
    deedsByPillar,
    minutesByPillar,
    feelings,
    thoughts,
    pillarsWithThoughts,
  };
}

export function buildResumeContextForAi(
  agg: ResumeAggregation,
  profile: UserProfile | null | undefined,
  scope: ResumeScope,
  dayCount: number,
  t: (key: TranslationKey) => string,
): string {
  const lines: string[] = [];

  if (scope === 'global') {
    for (const p of PILLARS) {
      const deedTarget = periodDeedTarget(profile, p, dayCount);
      const durTarget = periodDurationTargetMinutes(profile, p, dayCount);
      lines.push(
        `${p}: deeds ${agg.deedsByPillar[p]}/${deedTarget || '—'}, duration ${agg.minutesByPillar[p]}m target ${durTarget || '—'}m`,
      );
    }
  } else {
    const deedTarget = periodDeedTarget(profile, scope, dayCount);
    const durTarget = periodDurationTargetMinutes(profile, scope, dayCount);
    lines.push(
      `${scope}: deeds ${agg.deedCount}/${deedTarget || '—'}, duration ${agg.minutesByPillar[scope]}m target ${durTarget || '—'}m`,
    );
  }

  lines.push('Feelings: ' + JSON.stringify(agg.feelings));

  const deedLines = agg.deeds
    .slice(0, 80)
    .map((d) => {
      const dur = formatDeedDurationPhrase(d, t);
      return `- [${d.date} ${d.time}] ${d.pillar} | ${d.actionName} | ${d.feeling}${dur ? ` | ${dur}` : ''}`;
    });
  lines.push('Activities:\n' + deedLines.join('\n'));

  if (agg.thoughts.length) {
    lines.push(
      'Thoughts (verbatim):\n' +
        agg.thoughts
          .map((th) => `- [${th.date}] ${th.pillar} / ${th.actionName}: "${th.text}"`)
          .join('\n'),
    );
  }

  return lines.join('\n\n');
}
