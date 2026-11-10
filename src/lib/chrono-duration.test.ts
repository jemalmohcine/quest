import { computeChronoElapsedMs } from '@/stores/chronometer-store';
import { chronoDurationFields } from '@/lib/chrono-duration';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const t0 = 1_000_000;
const started = t0;
const pauseAt = t0 + 10_000;
const resumeAt = t0 + 25_000;
const now = t0 + 40_000;
const pausedMs = resumeAt - pauseAt;

const running = computeChronoElapsedMs(
  {
    sessionStartedAt: started,
    totalPausedMs: pausedMs,
    paused: false,
    pauseStartedAt: null,
    hasSession: true,
  },
  now,
);
assert(running === 25_000, `running elapsed expected 25000 got ${running}`);

const paused = computeChronoElapsedMs(
  {
    sessionStartedAt: started,
    totalPausedMs: 0,
    paused: true,
    pauseStartedAt: pauseAt,
    hasSession: true,
  },
  now,
);
assert(paused === 10_000, `paused elapsed expected 10000 got ${paused}`);

assert(chronoDurationFields(45).durationUnit === 'seconds', 'under 60s');
assert(chronoDurationFields(120).durationUnit === 'minutes', 'minutes');
assert(chronoDurationFields(7200).durationUnit === 'hours', 'hours');

console.log('chrono-duration.test.ts: ok');
