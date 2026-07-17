import { useState } from 'react';
import { useStore } from '../store/useStore';
import * as data from '../data/db';
import { ENROLL_TARGET_SAMPLES } from '../config';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../types';
import type { Phrase, PhraseCategory } from '../types';
import { EnrollDialog } from './EnrollDialog';

export function PhraseManager() {
  const profile = useStore((s) => s.profile);
  const phrases = useStore((s) => s.phrases);
  const counts = useStore((s) => s.templateCounts);
  const refreshPhrases = useStore((s) => s.refreshPhrases);

  const [enrolling, setEnrolling] = useState<Phrase | null>(null);
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<PhraseCategory>('custom');

  if (!profile) return null;

  const addPhrase = async () => {
    const text = newText.trim();
    if (!text) return;
    const phrase: Phrase = {
      id: crypto.randomUUID(),
      profileId: profile.id,
      text,
      spokenText: text,
      category: newCategory,
      order: phrases.length,
      createdAt: Date.now(),
    };
    await data.putPhrase(phrase);
    setNewText('');
    await refreshPhrases();
  };

  const removePhrase = async (phrase: Phrase) => {
    if (!window.confirm(`Delete “${phrase.text}” and its voice samples?`)) return;
    await data.deletePhrase(phrase.id);
    await refreshPhrases();
  };

  return (
    <div className="manager">
      <p className="manager-intro">
        Record how <b>{profile.name}</b> says each phrase — aim for {ENROLL_TARGET_SAMPLES} samples
        each. Short sessions are fine; progress saves automatically.
      </p>

      <div className="add-row">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void addPhrase()}
          placeholder="Add a phrase…"
          aria-label="New phrase text"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as PhraseCategory)}
          aria-label="Category"
        >
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => void addPhrase()}>
          Add
        </button>
      </div>

      <ul className="phrase-list">
        {phrases.map((phrase) => {
          const n = counts[phrase.id] ?? 0;
          const status = n >= ENROLL_TARGET_SAMPLES ? 'ok' : n > 0 ? 'partial' : 'none';
          return (
            <li key={phrase.id} className="phrase-row">
              <div className="phrase-row-main">
                <span className="phrase-row-text">{phrase.text}</span>
                <span className={`sample-badge ${status}`}>
                  {n} / {ENROLL_TARGET_SAMPLES}
                </span>
              </div>
              <div className="phrase-row-actions">
                <button type="button" onClick={() => setEnrolling(phrase)}>
                  🎙️ Record
                </button>
                <button
                  type="button"
                  className="danger"
                  aria-label={`Delete ${phrase.text}`}
                  onClick={() => void removePhrase(phrase)}
                >
                  ✕
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {enrolling && <EnrollDialog phrase={enrolling} onClose={() => setEnrolling(null)} />}
    </div>
  );
}
