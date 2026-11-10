import type { ResumePeriodType } from '@/lib/resume-periods';
import type { ResumeScope } from '@/lib/resume-periods';

export function buildPeriodResumePrompt(opts: {
  userName: string;
  language: 'en' | 'fr';
  periodType: ResumePeriodType;
  periodStart: string;
  periodEnd: string;
  scope: ResumeScope;
  contextBlock: string;
}): string {
  const lang = opts.language === 'fr' ? 'French' : 'English';
  const scopeLabel = opts.scope === 'global' ? 'all pillars (global)' : `pillar: ${opts.scope}`;
  const periodLabel =
    opts.periodType === 'day' ? 'day' : opts.periodType === 'week' ? 'week (Mon–Sun)' : 'month';

  return `
You are Quest's reflective coach. Write a ${periodLabel} summary for ${opts.userName} (${scopeLabel}).
Period: ${opts.periodStart} to ${opts.periodEnd}.

Use Markdown. Write entirely in ${lang}.

Structure (use these headings):
## Narrative
Short warm paragraph (3-5 sentences).

## Highlights
- 2-4 bullet wins tied to real activities.

## Progress vs goals
Deeds and duration (with units when known) vs targets from the data. Mention pillars when scope is global.

## Feeling trend
One short paragraph on how they felt across the period.

## Themes from thoughts
If thoughts are present, name key themes using verbatim quotes lightly. If none, say thoughts were quiet this period.

## Suggestions
1-3 concrete, actionable ideas for the next ${periodLabel}.

Rules:
- Base everything on the data below; do not invent deeds.
- For per-pillar scope, focus only on that pillar.
- Keep total length under 400 words unless data is very rich.

Data:
${opts.contextBlock}
`.trim();
}
