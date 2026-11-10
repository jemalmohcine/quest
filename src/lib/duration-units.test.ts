import { durationToMinutes, parseDurationInput, minutesToDurationUnit } from './duration-units';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(durationToMinutes(2, 'hours') === 120, '2 hours = 120 min');
assert(parseDurationInput('30', 'minutes') === 30, 'parse minutes');
assert(minutesToDurationUnit(90, 'hours') === 1.5, '90 min in hours');
console.log('duration-units.test.ts: ok');
