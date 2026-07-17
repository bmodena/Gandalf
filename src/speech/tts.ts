import type { ProfileSettings } from '../types';

/**
 * Text-to-speech via the Web Speech API. Uses the operating system's built-in
 * voices, which work offline on iOS/macOS/Android and require no downloads.
 */

export function listVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis?.getVoices() ?? [];
}

/** Voices populate asynchronously on some browsers; resolve once available. */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = listVoices();
    if (existing.length) {
      resolve(existing);
      return;
    }
    const synth = window.speechSynthesis;
    if (!synth) {
      resolve([]);
      return;
    }
    const handler = () => {
      synth.removeEventListener('voiceschanged', handler);
      resolve(listVoices());
    };
    synth.addEventListener('voiceschanged', handler);
    // Safety net in case the event never fires.
    setTimeout(() => resolve(listVoices()), 1000);
  });
}

type SpeakSettings = Pick<ProfileSettings, 'voiceURI' | 'ttsRate' | 'ttsPitch'>;

export function speak(text: string, settings: SpeakSettings): void {
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = settings.ttsRate;
  utterance.pitch = settings.ttsPitch;
  // Fall back to the Gandalf-like default so the very first spoken phrase already
  // uses a fitting voice, even before the caregiver visits settings.
  const voices = listVoices();
  const uri = settings.voiceURI ?? pickDefaultVoice(voices);
  if (uri) {
    const voice = voices.find((v) => v.voiceURI === uri);
    if (voice) utterance.voice = voice;
  }
  synth.speak(utterance);
}

/**
 * Pick a sensible default voice, preferring a deep British male voice reminiscent
 * of Gandalf the Grey. Which voices actually exist depends on the OS/browser, so
 * this scores whatever is available rather than assuming a specific one.
 *
 * Good matches by platform: "Daniel" / "Arthur" / "Oliver" (Apple, en-GB),
 * "Microsoft George" (Windows, en-GB), "Google UK English Male" (Chrome/Android).
 */
export function pickDefaultVoice(voices: SpeechSynthesisVoice[]): string | null {
  if (voices.length === 0) return null;

  const gandalfNames = [
    'daniel',
    'arthur',
    'oliver',
    'george',
    'james',
    'ryan',
    'uk english male',
  ];
  const avoidNames = [
    'female',
    'samantha',
    'karen',
    'moira',
    'tessa',
    'fiona',
    'serena',
    'zira',
    'hazel',
  ];

  const score = (v: SpeechSynthesisVoice): number => {
    const name = v.name.toLowerCase();
    const lang = (v.lang ?? '').toLowerCase();
    let s = 0;
    if (gandalfNames.some((n) => name.includes(n))) s += 100;
    if (/\bmale\b/.test(name)) s += 40;
    if (lang.startsWith('en-gb')) s += 50;
    else if (lang.startsWith('en')) s += 15;
    if (v.localService) s += 20; // offline-capable
    if (avoidNames.some((n) => name.includes(n))) s -= 60;
    return s;
  };

  const best = [...voices].sort((a, b) => score(b) - score(a))[0];
  return best?.voiceURI ?? null;
}
