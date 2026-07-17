import type { MatchResult, Phrase } from '../types';

interface Props {
  result: MatchResult;
  /** Re-speak a phrase (used for the confirmed top guess). */
  onSpeak: (phrase: Phrase) => void;
  /** Pick a different phrase — speaks it and learns from the correction. */
  onCorrect: (phrase: Phrase) => void;
  onDismiss: () => void;
}

export function ResultCard({ result, onSpeak, onCorrect, onDismiss }: Props) {
  const best = result.best;

  if (!best) {
    return (
      <div className="notice">
        No match yet — record samples in <b>Setup</b>, or tap a phrase below to speak it.
      </div>
    );
  }

  const high = result.confidence === 'high';
  const alternatives = result.candidates.filter((c) => c.phrase.id !== best.phrase.id);

  return (
    <div className={`result-card ${high ? 'high' : 'low'}`}>
      <div className="result-lead">{high ? 'You said' : 'Did you mean…'}</div>

      <button type="button" className="result-best" onClick={() => onSpeak(best.phrase)}>
        <span className="result-best-text">{best.phrase.text}</span>
        <span className="result-speak">🔊 Speak again</span>
      </button>

      {alternatives.length > 0 && (
        <>
          <div className="result-alt-label">Not right? Tap the correct one:</div>
          <div className="result-alts">
            {alternatives.map((c) => (
              <button
                key={c.phrase.id}
                type="button"
                className="result-alt"
                onClick={() => onCorrect(c.phrase)}
              >
                {c.phrase.text}
              </button>
            ))}
          </div>
          <div className="result-alt-label subtle">
            Still not it? Tap the correct phrase in the list below — it will learn.
          </div>
        </>
      )}

      <button type="button" className="result-dismiss" onClick={onDismiss}>
        Cancel
      </button>
    </div>
  );
}
