import type { TurnState } from '../hooks/useRecognizer';

interface Props {
  state: TurnState;
  level: number;
  onStart: () => void;
  onStop: () => void;
}

export function TalkButton({ state, level, onStart, onStop }: Props) {
  const listening = state === 'listening';
  const busy = state === 'thinking';
  const label = listening
    ? 'Listening… tap to stop'
    : busy
      ? 'Thinking…'
      : 'Tap to talk';

  const handleClick = () => {
    if (listening) onStop();
    else if (!busy) onStart();
  };

  return (
    <button
      type="button"
      className={`talk-btn ${listening ? 'listening' : ''} ${busy ? 'busy' : ''}`}
      onClick={handleClick}
      disabled={busy}
      aria-label={label}
    >
      <span
        className="talk-btn-ring"
        style={{ transform: `scale(${1 + level * 0.35})` }}
        aria-hidden="true"
      />
      <span className="talk-btn-icon" aria-hidden="true">
        {listening ? '⏹' : busy ? '…' : '🎤'}
      </span>
      <span className="talk-btn-label">{label}</span>
    </button>
  );
}
