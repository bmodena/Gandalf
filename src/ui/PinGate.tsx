import { useState } from 'react';
import { useStore } from '../store/useStore';

export function PinGate() {
  const profile = useStore((s) => s.profile);
  const setMode = useStore((s) => s.setMode);
  const setTrainerUnlocked = useStore((s) => s.setTrainerUnlocked);

  const [entry, setEntry] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    if (entry === profile?.settings.pin) {
      setTrainerUnlocked(true);
    } else {
      setError(true);
      setEntry('');
    }
  };

  return (
    <div className="pin-gate">
      <h2>Enter caregiver PIN</h2>
      <input
        className="pin-input"
        type="password"
        inputMode="numeric"
        autoFocus
        value={entry}
        onChange={(e) => {
          setEntry(e.target.value);
          setError(false);
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      {error && <p className="notice error">Incorrect PIN</p>}
      <div className="pin-actions">
        <button type="button" onClick={submit}>
          Unlock
        </button>
        <button type="button" className="secondary" onClick={() => setMode('talk')}>
          Back
        </button>
      </div>
    </div>
  );
}
