import { buildActionNameSuggestions, filterActionNameSuggestions } from './deed-name-suggestions';
import type { Deed } from '@/types';

function deed(partial: Partial<Deed> & Pick<Deed, 'actionName' | 'pillar'>): Deed {
  return {
    date: '2026-11-10',
    time: '12:00',
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

const list = buildActionNameSuggestions([
  deed({ actionName: 'Run', pillar: 'healthset', date: '2026-11-09', time: '08:00' }),
  deed({ actionName: 'Run', pillar: 'healthset', date: '2026-11-10', time: '09:00' }),
  deed({ actionName: 'Meditate', pillar: 'soulset' }),
]);
assert(list[0]?.actionName === 'Run' && list[0].count === 2, 'aggregate by name');

const filtered = filterActionNameSuggestions(list, { pillar: 'soulset', query: 'med', limit: 4 });
assert(filtered.length === 1 && filtered[0]?.actionName === 'Meditate', 'pillar + query filter');

console.log('deed-name-suggestions.test.ts: ok');
