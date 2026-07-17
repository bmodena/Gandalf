import { useStore } from '../store/useStore';

export function ConsentGate() {
  const profile = useStore((s) => s.profile);
  const acceptConsent = useStore((s) => s.acceptConsent);
  const name = profile?.name ?? 'this person';

  return (
    <div className="consent">
      <div className="consent-card">
        <h1>Welcome</h1>
        <p>
          This app helps <b>{name}</b> be understood. It learns how they say each phrase, then
          speaks a clear version out loud.
        </p>
        <ul className="consent-points">
          <li>🎙️ It records short voice samples to learn from.</li>
          <li>
            💾 Samples are saved on <b>this device</b> and also uploaded to a <b>private, secure
            database</b> the care team controls — used only to improve accuracy and back up the
            training. They are never sold, shared, or made public.
          </li>
          <li>
            📶 It still works offline; uploads happen in the background when there’s a connection.
          </li>
          <li>
            👤 A caregiver sets up phrases and records samples in <b>Setup</b>.
          </li>
        </ul>
        <p className="consent-ack">
          By continuing, the caregiver confirms they have this person’s permission to record their
          voice and store these recordings for training.
        </p>
        <button type="button" className="consent-btn" onClick={() => void acceptConsent()}>
          I understand — continue
        </button>
      </div>
    </div>
  );
}
