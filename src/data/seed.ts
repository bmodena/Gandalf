import type { Phrase, PhraseCategory, Profile, ProfileSettings } from '../types';
import { MATCH } from '../config';

/**
 * Default seed phrase set.
 *
 * Grounded in AAC core-vocabulary research (a small set of high-frequency,
 * multipurpose phrases covers the majority of everyday communication) and the
 * content of proven hospital / ICU patient communication boards (pain, needs,
 * feelings, requests for people, yes/no, and social phrases). Intended as a
 * starting point the caregiver tailors to the individual.
 */

export const DEFAULT_SETTINGS: ProfileSettings = {
  voiceURI: null,
  // Slightly slow and low for a graver, Gandalf-the-Grey delivery. Tunable in Setup.
  ttsRate: 0.9,
  ttsPitch: 0.85,
  acceptDistance: MATCH.acceptDistance,
  alwaysConfirm: false,
  pin: null,
};

interface SeedPhrase {
  text: string;
  category: PhraseCategory;
  /** Optional expanded sentence spoken aloud (defaults to `text`). */
  spokenText?: string;
}

export const SEED_PHRASES: SeedPhrase[] = [
  // Responses — the highest-frequency words in all of communication.
  { text: 'Yes', category: 'responses' },
  { text: 'No', category: 'responses' },
  { text: 'Maybe', category: 'responses' },
  { text: "I don't know", category: 'responses' },
  { text: 'Please', category: 'responses' },
  { text: 'Thank you', category: 'responses' },

  // Needs — basic wants and physical state.
  { text: 'I need the bathroom', category: 'needs' },
  { text: "I'm thirsty", category: 'needs', spokenText: "I'm thirsty. Can I have some water?" },
  { text: "I'm hungry", category: 'needs' },
  { text: "I'm in pain", category: 'needs' },
  { text: "I'm tired", category: 'needs' },
  { text: "I'm too hot", category: 'needs' },
  { text: "I'm too cold", category: 'needs' },
  { text: 'I need my medicine', category: 'needs' },

  // Requests — asking for help or action.
  { text: 'Please help me', category: 'requests' },
  { text: 'Call the nurse', category: 'requests' },
  { text: 'Call my family', category: 'requests' },
  { text: 'Come here', category: 'requests' },
  { text: 'Please wait', category: 'requests' },
  { text: 'Stop', category: 'requests' },
  { text: 'I want to sit up', category: 'requests' },
  { text: 'I want to lie down', category: 'requests' },

  // Feelings.
  { text: "I'm okay", category: 'feelings' },
  { text: "I'm not okay", category: 'feelings' },
  { text: "I'm happy", category: 'feelings' },
  { text: "I'm frustrated", category: 'feelings' },
  { text: "I'm scared", category: 'feelings' },

  // Social.
  { text: 'Hello', category: 'social' },
  { text: 'Goodbye', category: 'social' },
  { text: 'How are you?', category: 'social', spokenText: 'How are you?' },
  { text: 'I love you', category: 'social' },
  { text: "I'm finished", category: 'social' },
];

export function createProfile(name: string): Profile {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    consentAcceptedAt: null,
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function buildSeedPhrases(profileId: string): Phrase[] {
  return SEED_PHRASES.map((p, index) => ({
    id: crypto.randomUUID(),
    profileId,
    text: p.text,
    spokenText: p.spokenText ?? p.text,
    category: p.category,
    order: index,
    createdAt: Date.now(),
  }));
}
