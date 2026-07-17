import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Profile } from '../types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UsersPanel() {
  const profiles = useStore((s) => s.profiles);
  const active = useStore((s) => s.profile);
  const switchProfile = useStore((s) => s.switchProfile);
  const addProfile = useStore((s) => s.addProfile);
  const renameProfile = useStore((s) => s.renameProfile);
  const deleteProfile = useStore((s) => s.deleteProfile);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const canCreate = name.trim().length > 0 && EMAIL_RE.test(email.trim());

  const create = async () => {
    if (!canCreate) return;
    await addProfile(name, email);
    setName('');
    setEmail('');
    setAdding(false);
  };

  const rename = async (p: Profile) => {
    const next = window.prompt('New name for this user', p.name);
    if (next && next.trim()) await renameProfile(p.id, next);
  };

  const remove = async (p: Profile) => {
    if (
      !window.confirm(
        `Delete “${p.name}” and ALL their voice recordings and phrases? This cannot be undone.`,
      )
    )
      return;
    await deleteProfile(p.id);
  };

  return (
    <div className="users">
      <p className="manager-intro">
        Choose who is using the app. Each person has their own voice training, phrases, and voice.
      </p>

      <ul className="user-list">
        {profiles.map((p) => {
          const isActive = p.id === active?.id;
          return (
            <li key={p.id} className={`user-row ${isActive ? 'active' : ''}`}>
              <button
                type="button"
                className="user-main"
                onClick={() => void switchProfile(p.id)}
                aria-pressed={isActive}
              >
                <span className="user-name">
                  {p.name}
                  {isActive && <span className="user-current"> • current</span>}
                </span>
                {p.email && <span className="user-email">{p.email}</span>}
              </button>
              <div className="user-actions">
                <button type="button" onClick={() => void rename(p)} aria-label={`Rename ${p.name}`}>
                  ✎
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => void remove(p)}
                  aria-label={`Delete ${p.name}`}
                  disabled={profiles.length === 1}
                >
                  ✕
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {adding ? (
        <div className="add-user">
          <input
            placeholder="Name (e.g. Dad)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            aria-label="New user name"
          />
          <input
            type="email"
            inputMode="email"
            placeholder="Email (their account)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="New user email"
          />
          <p className="field-hint">
            By adding, you confirm you have this person’s permission to record their voice.
          </p>
          <div className="add-user-actions">
            <button type="button" className="primary" disabled={!canCreate} onClick={() => void create()}>
              Add user
            </button>
            <button type="button" className="secondary" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="primary add-user-btn" onClick={() => setAdding(true)}>
          + Add a user
        </button>
      )}
    </div>
  );
}
