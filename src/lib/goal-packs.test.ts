import {
  detectMatchingGoalPack,
  getGoalPack,
  goalPackToProfileSettings,
  GOAL_PACK_IDS,
  profileMatchesGoalPack,
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

console.log('goal-packs.test.ts: ok');
