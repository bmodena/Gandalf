import { useState } from 'react';
import { useStore } from '../store/useStore';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailGate() {
  const setEmail = useStore((s) => s.setEmail);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const valid = EMAIL_RE.test(value.trim());

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    await setEmail(value);
  };

  return (
    <div className="consent">
      <div className="consent-card">
        <h1>One more thing</h1>
        <p>
          Enter an email address to use as this person’s account. Their recordings are grouped
          under it so they can be found and used for training later.
        </p>
        <label className="field">
          <span className="field-label">Email address</span>
          <input
            type="email"
            inputMode="email"
            autoFocus
            autoComplete="email"
            placeholder="name@example.com"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void submit()}
          />
        </label>
        <p className="consent-ack">
          This email is used only to organize recordings — no marketing, ever.
        </p>
        <button
          type="button"
          className="consent-btn"
          disabled={!valid || saving}
          onClick={() => void submit()}
        >
          {saving ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
