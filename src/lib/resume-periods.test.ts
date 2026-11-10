import { isResumePeriodEnded, periodBoundsYmd, shiftPeriodStart } from './resume-periods';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const TZ = 'America/New_York';

assert(periodBoundsYmd('week', '2026-11-03').to === '2026-11-09', 'Mon-Sun week');
assert(periodBoundsYmd('month', '2026-11-01').from === '2026-11-01', 'month start');
assert(shiftPeriodStart('day', '2026-11-10', -1) === '2026-11-09', 'prev day');

const beforeEight = new Date('2026-11-12T00:30:00.000Z'); // ~19:30 America/New_York on 2026-11-11
assert(
  !isResumePeriodEnded('day', '2026-11-11', beforeEight, TZ, 20),
  'same day before 20:00 local not ended',
);

const afterEight = new Date('2026-11-12T02:30:00.000Z'); // ~21:30 America/New_York on 2026-11-11
assert(isResumePeriodEnded('day', '2026-11-11', afterEight, TZ, 20), 'day ended after 20:00');

console.log('resume-periods.test.ts: ok');
