/** Domain model for the assistive speech communicator. */

export type PhraseCategory =
  | 'responses'
  | 'needs'
  | 'requests'
  | 'feelings'
  | 'social'
  | 'custom';

export const CATEGORY_LABELS: Record<PhraseCategory, string> = {
  responses: 'Responses',
  needs: 'Needs',
  requests: 'Requests',
  feelings: 'Feelings',
  social: 'Social',
  custom: 'Custom',
};

export const CATEGORY_ORDER: PhraseCategory[] = [
  'responses',
  'needs',
  'requests',
  'feelings',
  'social',
  'custom',
];

export interface ProfileSettings {
  /** Chosen SpeechSynthesis voiceURI, or null for the system default. */
  voiceURI: string | null;
  /** TTS speaking rate (0.5–1.5). */
  ttsRate: number;
  /** TTS pitch (0–2). */
  ttsPitch: number;
  /** Absolute DTW accept distance — auto-speak only when the best match is below this. */
  acceptDistance: number;
  /** Always show the guess and require a tap before speaking (overrides confidence gating). */
  alwaysConfirm: boolean;
  /** Optional caregiver PIN protecting Trainer mode. Null = unprotected. */
  pin: string | null;
}

export interface Profile {
  id: string;
  name: string;
  createdAt: number;
  /** Timestamp the caregiver accepted the recording/consent notice, or null. */
  consentAcceptedAt: number | null;
  settings: ProfileSettings;
}

export interface Phrase {
  id: string;
  profileId: string;
  /** Text shown on screen. */
  text: string;
  /** Text spoken by TTS (usually identical to `text`, but can be expanded). */
  spokenText: string;
  category: PhraseCategory;
  order: number;
  createdAt: number;
}

export interface Template {
  id: string;
  profileId: string;
  phraseId: string;
  /** MFCC feature sequence: frames × coefficients. */
  mfcc: number[][];
  durationMs: number;
  /** Where the sample came from — deliberate enrollment or an in-context correction. */
  source: 'enroll' | 'correction';
  createdAt: number;
  /** Original recording (WAV), kept locally and uploaded to the training corpus. */
  audio?: Blob;
  sampleRate?: number;
  /** True once this sample has been uploaded to the central corpus. */
  synced?: boolean;
}

export interface Candidate {
  phrase: Phrase;
  /** Normalized DTW distance (lower is better). */
  distance: number;
}

export type Confidence = 'high' | 'low' | 'none';

export interface MatchResult {
  /** Best-first, capped at MATCH.candidateCount. */
  candidates: Candidate[];
  best: Candidate | null;
  confidence: Confidence;
  /** Relative gap between best and second-best (0–1). */
  marginRatio: number;
}
