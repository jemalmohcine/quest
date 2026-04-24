import { PILLARS } from '@/types';

export function buildAudioExtractPrompt(language: 'fr' | 'en', feelingChoices: string[]): string {
  const lang = language === 'fr' ? 'French' : 'English';
  const fidelity =
    language === 'fr'
      ? `Fidélité au discours : le titre (actionName) doit coller à ce que la personne a réellement dit (ex. « j'ai fait 20 minutes de méditation » → un titre proche, pas un autre sport). N'invente pas d'activité absente de l'audio.`
      : `Faithfulness: actionName must match what the speaker actually said (e.g. "I meditated 20 minutes" → keep that meaning). Do not invent activities they did not mention.`;

  return `Listen to the audio and extract ONE deed (one concrete action) the user describes.

${fidelity}

Pillar keywords (pick exactly one): soulset, healthset, mindset, skillset, heartset — use the definitions below only to choose the pillar, not to rewrite their story.
- soulset: meditation, prayer, gratitude, spiritual practice, breathing, silence
- healthset: exercise, sleep, food, hydration, sport, body care
- mindset: learning, reading, focus, planning, study, journaling for clarity
- skillset: craft, coding, music practice, training a skill for work or art
- heartset: family, friends, kindness, volunteering, emotional connection

Return JSON with:
- pillar: one of ${PILLARS.join(' | ')}
- actionName: short title in ${lang}, faithful to their words (light polish OK, no marketing fluff)
- duration: minutes as a number if they stated a duration, else null
- feeling: exactly one of: ${feelingChoices.join(', ')}
- thought: one short reflective sentence only if they expressed a reflection, else null

Language for actionName and thought: ${lang}.`;
}
