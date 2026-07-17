import { useCallback, useRef, useState } from 'react';
import { captureUtterance } from '../audio/capture';
import type { Recorder } from '../audio/recorder';
import { matchUtterance } from '../recognition/matcher';
import type { PhraseTemplates } from '../recognition/matcher';
import { speak } from '../speech/tts';
import * as data from '../data/db';
import { useStore } from '../store/useStore';
import type { MatchResult, Phrase, Template } from '../types';

export type TurnState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'result'
  | 'tooShort'
  | 'error';

/**
 * Orchestrates a single "talk turn": record → features → match → confidence →
 * (optionally) speak. Also owns the self-heal correction: the just-captured
 * utterance can be attached to any phrase as a new template, instantly improving
 * future recognition with no retraining.
 */
export function useRecognizer() {
  const profile = useStore((s) => s.profile);
  const phrases = useStore((s) => s.phrases);
  const refreshTemplateCounts = useStore((s) => s.refreshTemplateCounts);

  const [state, setState] = useState<TurnState>('idle');
  const [level, setLevel] = useState(0);
  const [result, setResult] = useState<MatchResult | null>(null);

  const recorderRef = useRef<Recorder | null>(null);
  const lastMfcc = useRef<number[][] | null>(null);
  const lastDurationMs = useRef(0);

  const buildLibrary = useCallback(async (): Promise<PhraseTemplates[]> => {
    const library: PhraseTemplates[] = [];
    for (const phrase of phrases) {
      library.push({ phrase, templates: await data.getTemplatesForPhrase(phrase.id) });
    }
    return library;
  }, [phrases]);

  const startTurn = useCallback(async () => {
    if (!profile) return;
    setResult(null);
    setState('listening');
    try {
      const captured = await captureUtterance(setLevel, (r) => {
        recorderRef.current = r;
      });
      recorderRef.current = null;
      setLevel(0);
      setState('thinking');

      if (captured.tooShort) {
        setState('tooShort');
        return;
      }

      lastMfcc.current = captured.mfcc;
      lastDurationMs.current = captured.durationMs;

      const library = await buildLibrary();
      const match = matchUtterance(captured.mfcc, library, profile.settings.acceptDistance);
      setResult(match);
      setState('result');

      if (!profile.settings.alwaysConfirm && match.confidence === 'high' && match.best) {
        speak(match.best.phrase.spokenText, profile.settings);
      }
    } catch (err) {
      console.error('Recognition failed', err);
      setState('error');
    }
  }, [profile, buildLibrary]);

  /** Stop an in-progress recording early (user tapped the button again). */
  const stopListening = useCallback(() => {
    void recorderRef.current?.stop();
  }, []);

  const speakPhrase = useCallback(
    (phrase: Phrase) => {
      if (!profile) return;
      speak(phrase.spokenText, profile.settings);
    },
    [profile],
  );

  /**
   * Self-heal: attach the last utterance to `phrase` as a new template. Used
   * when the user picks the right phrase after a wrong/low-confidence guess.
   */
  const correctTo = useCallback(
    async (phrase: Phrase) => {
      if (!profile || !lastMfcc.current) return;
      const template: Template = {
        id: crypto.randomUUID(),
        profileId: profile.id,
        phraseId: phrase.id,
        mfcc: lastMfcc.current,
        durationMs: lastDurationMs.current,
        source: 'correction',
        createdAt: Date.now(),
      };
      await data.putTemplate(template);
      await refreshTemplateCounts();
      speak(phrase.spokenText, profile.settings);
    },
    [profile, refreshTemplateCounts],
  );

  const reset = useCallback(() => {
    setState('idle');
    setResult(null);
  }, []);

  return { state, level, result, startTurn, stopListening, speakPhrase, correctTo, reset };
}
