import { useStore } from '../store/useStore';
import { useEnroller } from '../hooks/useEnroller';
import { ENROLL_TARGET_SAMPLES } from '../config';
import type { Phrase } from '../types';

interface Props {
  phrase: Phrase;
  onClose: () => void;
}

export function EnrollDialog({ phrase, onClose }: Props) {
  const count = useStore((s) => s.templateCounts[phrase.id] ?? 0);
  const { state, level, record, stop } = useEnroller(phrase);

  const recording = state === 'recording';
  const saving = state === 'saving';
  const done = count >= ENROLL_TARGET_SAMPLES;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">“{phrase.text}”</h2>
        <p className={`modal-count ${done ? 'ok' : ''}`}>
          {count} of {ENROLL_TARGET_SAMPLES} samples {done ? '✓' : ''}
        </p>
        <p className="modal-help">Tap record, say the phrase once, and it stops on its own.</p>

        <button
          type="button"
          className={`record-btn ${recording ? 'recording' : ''}`}
          onClick={recording ? stop : () => void record()}
          disabled={saving}
        >
          <span
            className="record-ring"
            style={{ transform: `scale(${1 + level * 0.4})` }}
            aria-hidden="true"
          />
          {recording ? 'Listening… tap to stop' : saving ? 'Saving…' : 'Record'}
        </button>

        {state === 'tooShort' && (
          <p className="notice">Too short — say the whole phrase, then it stops on its own.</p>
        )}
        {state === 'error' && <p className="notice error">Microphone problem. Try again.</p>}

        <button type="button" className="modal-done" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
