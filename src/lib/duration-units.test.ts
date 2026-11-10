import {
  durationToMinutes,
  durationToSeconds,
  parseDurationInput,
  parseDurationToSeconds,
  minutesToDurationUnit,
  deedDurationFieldsFromInput,
  getDeedDurationSeconds,
  formatDeedDurationPhrase,
} from './duration-units';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(durationToMinutes(2, 'hours') === 120, '2 hours = 120 min');
assert(durationToSeconds(60, 'seconds') === 60, '60 seconds');
assert(durationToSeconds(50, 'minutes') === 50 * 60, '50 minutes in seconds');
assert(parseDurationToSeconds('60', 'seconds') === 60, 'parse 60 seconds');
assert(parseDurationInput('50', 'minutes') === 50, 'parse 50 minutes to legacy minutes');
assert(minutesToDurationUnit(90, 'hours') === 1.5, '90 min as hours');

const fields = deedDurationFieldsFromInput('50', 'minutes');
assert(fields.ok && fields.fields.duration_seconds === 3000, '50 min fields');
assert(getDeedDurationSeconds({ durationSeconds: 60, durationUnit: 'seconds' }) === 60, 'read seconds');
assert(getDeedDurationSeconds({ duration: 5 }) === 300, 'legacy minutes');

const phrase = formatDeedDurationPhrase(
  { durationSeconds: 60, durationUnit: 'seconds' },
  (k) => (k === 'durationPhraseSeconds' ? 'seconds' : k),
);
assert(phrase === '60 seconds', 'display phrase');

const oneMin = formatDeedDurationPhrase(
  { durationSeconds: 60, durationUnit: 'minutes' },
  (k) => (k === 'durationPhraseMinute' ? 'minute' : k === 'durationPhraseMinutes' ? 'minutes' : k),
);
assert(oneMin === '1 minute', 'singular minute');

console.log('duration-units.test.ts: ok');
