import { aggregateDeedsForResume } from './resume-aggregation';
import type { Deed } from '@/types';

function deed(partial: Partial<Deed> & Pick<Deed, 'pillar' | 'actionName'>): Deed {
  return {
    date: '2026-11-10',
    time: '10:00',
    feeling: 'happy',
    week: 1,
    month: '2026-11',
    year: 2026,
    ...partial,
  } as Deed;
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const agg = aggregateDeedsForResume(
  [
    deed({ pillar: 'mindset', actionName: 'Read', thought: 'Deep focus' }),
    deed({ pillar: 'mindset', actionName: 'Run' }),
    deed({ pillar: 'healthset', actionName: 'Yoga' }),
  ],
  'mindset',
  7,
  null,
);

assert(agg.deedCount === 2, 'pillar scope filters');
assert(agg.thoughts.length === 1, 'thoughts captured');

console.log('resume-aggregation.test.ts: ok');
