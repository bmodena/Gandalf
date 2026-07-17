import { useStore } from '../store/useStore';
import { useRecognizer } from '../hooks/useRecognizer';
import { TalkButton } from './TalkButton';
import { ResultCard } from './ResultCard';
import { PhraseGrid } from './PhraseGrid';
import type { Phrase } from '../types';

export function TalkMode() {
  const { state, level, result, startTurn, stopListening, speakPhrase, correctTo, reset } =
    useRecognizer();

  const phrases = useStore((s) => s.phrases);
  const templateCounts = useStore((s) => s.templateCounts);
  const hasAnyTemplates = phrases.some((p) => (templateCounts[p.id] ?? 0) > 0);

  const showingResult = state === 'result' && result !== null;

  const handleGridSelect = (phrase: Phrase) => {
    if (showingResult) {
      // The grid doubles as a correction picker while a result is shown.
      void correctTo(phrase);
      reset();
    } else {
      speakPhrase(phrase);
    }
  };

  return (
    <div className="talk">
      <TalkButton state={state} level={level} onStart={startTurn} onStop={stopListening} />

      {!hasAnyTemplates && (
        <p className="hint">
          No voice samples yet. Go to <b>Setup</b> to record how you say each phrase — or just tap a
          phrase below to speak it.
        </p>
      )}

      {showingResult && (
        <ResultCard result={result} onSpeak={speakPhrase} onCorrect={(p) => { void correctTo(p); reset(); }} onDismiss={reset} />
      )}
      {state === 'tooShort' && (
        <div className="notice">Didn’t catch that — tap and say the whole phrase.</div>
      )}
      {state === 'error' && (
        <div className="notice error">Microphone problem. Check permissions and try again.</div>
      )}

      <PhraseGrid onSelect={handleGridSelect} correcting={showingResult} />
    </div>
  );
}
