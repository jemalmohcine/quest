import {
  detectMatchingGoalPack,
  getGoalPack,
  goalPackToProfileSettings,
  GOAL_PACK_IDS,
  isLegacyDefaultGoals,
  profileMatchesGoalPack,
  resolveDisplayedGoalPack,
  weeklyDurationMinutes,
  weeklyDeedTarget,
} from './goal-packs';
import type { UserProfile } from '@/types';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

for (const id of GOAL_PACK_IDS) {
  const settings = goalPackToProfileSettings(id);
  assert(settings.dailyObjective > 0, `${id} daily total`);
  assert(profileMatchesGoalPack(settings as UserProfile, id), `${id} round trip`);
}

const essential = goalPackToProfileSettings('essential');
assert(essential.objectivePerPillar.skillset === 1, 'essential skillset deeds');
assert(getGoalPack('balanced').deedsPerDay.healthset === 2, 'balanced health deeds');
assert(weeklyDeedTarget('momentum', 'heartset') === 21, 'momentum heartset week');
assert(weeklyDurationMinutes('essential', 'healthset') === 22 * 7, 'essential health minutes week');

const fake: UserProfile = {
  ...goalPackToProfileSettings('essential'),
  email: 'a@b.c',
  name: 'T',
  createdAt: '',
  language: 'en',
  theme: 'system',
  goalPackId: 'essential',
};
assert(detectMatchingGoalPack(fake) === 'essential', 'detect essential');

fake.objectivePerPillar.mindset = 2;
assert(detectMatchingGoalPack(fake) === null, 'detect custom after edit');

assert(resolveDisplayedGoalPack(fake) === 'custom', 'no highlight when pack id mismatches goals');
assert(
  resolveDisplayedGoalPack({ ...fake, goalPackId: 'essential' }) === 'custom',
  'drifted goals show custom',
);
assert(
  resolveDisplayedGoalPack(goalPackToProfileSettings('balanced') as UserProfile) === 'balanced',
  'balanced pack id shown when set',
);
assert(
  resolveDisplayedGoalPack(goalPackToProfileSettings('balanced') as UserProfile, { treatAsCustom: true }) ===
    'custom',
  'dirty goals force custom',
);

const legacy = {
  dailyObjective: 5,
  objectivePerPillar: { soulset: 1, healthset: 1, mindset: 1, skillset: 1, heartset: 1 },
  durationObjectivePerPillar: {},
} as UserProfile;
assert(isLegacyDefaultGoals(legacy), 'legacy default detected');

console.log('goal-packs.test.ts: ok');
