import { useCallback, useRef, useState } from 'react';
import { captureUtterance } from '../audio/capture';
import type { Recorder } from '../audio/recorder';
import * as data from '../data/db';
import { useStore } from '../store/useStore';
import type { Phrase, Template } from '../types';

export type EnrollState = 'idle' | 'recording' | 'saving' | 'tooShort' | 'error';

/** Records enrollment samples for a phrase and stores them as templates. */
export function useEnroller(phrase: Phrase | null) {
  const profile = useStore((s) => s.profile);
  const refreshTemplateCounts = useStore((s) => s.refreshTemplateCounts);

  const [state, setState] = useState<EnrollState>('idle');
  const [level, setLevel] = useState(0);
  const recorderRef = useRef<Recorder | null>(null);

  const record = useCallback(async () => {
    if (!profile || !phrase) return;
    setState('recording');
    try {
      const captured = await captureUtterance(setLevel, (r) => {
        recorderRef.current = r;
      });
      recorderRef.current = null;
      setLevel(0);

      if (captured.tooShort) {
        setState('tooShort');
        return;
      }

      setState('saving');
      const template: Template = {
        id: crypto.randomUUID(),
        profileId: profile.id,
        phraseId: phrase.id,
        mfcc: captured.mfcc,
        durationMs: captured.durationMs,
        source: 'enroll',
        createdAt: Date.now(),
      };
      await data.putTemplate(template);
      await refreshTemplateCounts();
      setState('idle');
    } catch (err) {
      console.error('Enrollment failed', err);
      setState('error');
    }
  }, [profile, phrase, refreshTemplateCounts]);

  const stop = useCallback(() => {
    void recorderRef.current?.stop();
  }, []);

  return { state, level, record, stop };
}
