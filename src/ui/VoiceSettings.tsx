import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { loadVoices, pickDefaultVoice, speak } from '../speech/tts';
import type { Profile, ProfileSettings } from '../types';

export function VoiceSettings() {
  const profile = useStore((s) => s.profile);
  const saveProfile = useStore((s) => s.saveProfile);

  const [draft, setDraft] = useState<Profile | null>(profile);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    void loadVoices().then((list) => {
      if (!active) return;
      setVoices(list);
      setDraft((current) => {
        if (!current || current.settings.voiceURI) return current;
        const uri = pickDefaultVoice(list);
        return uri ? { ...current, settings: { ...current.settings, voiceURI: uri } } : current;
      });
    });
    return () => {
      active = false;
    };
  }, []);

  if (!draft) return null;

  const patchSettings = (patch: Partial<ProfileSettings>) => {
    setSaved(false);
    setDraft({ ...draft, settings: { ...draft.settings, ...patch } });
  };

  const save = async () => {
    await saveProfile(draft);
    setSaved(true);
  };

  const preview = () => speak('A wizard is never late. This is how I will sound.', draft.settings);

  const englishFirst = [...voices].sort((a, b) => {
    const ae = a.lang?.toLowerCase().startsWith('en') ? 0 : 1;
    const be = b.lang?.toLowerCase().startsWith('en') ? 0 : 1;
    return ae - be;
  });

  return (
    <div className="settings">
      <label className="field">
        <span className="field-label">Name</span>
        <input
          value={draft.name}
          onChange={(e) => {
            setSaved(false);
            setDraft({ ...draft, name: e.target.value });
          }}
        />
      </label>

      <label className="field">
        <span className="field-label">
          Account email
          <span className="field-hint"> (groups recordings for training)</span>
        </span>
        <input
          type="email"
          inputMode="email"
          value={draft.email ?? ''}
          onChange={(e) => {
            setSaved(false);
            setDraft({ ...draft, email: e.target.value });
          }}
        />
      </label>

      <label className="field">
        <span className="field-label">Voice</span>
        <select
          value={draft.settings.voiceURI ?? ''}
          onChange={(e) => patchSettings({ voiceURI: e.target.value || null })}
        >
          <option value="">System default</option>
          {englishFirst.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name} ({v.lang}){v.localService ? ' • offline' : ''}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label">Speaking speed: {draft.settings.ttsRate.toFixed(2)}×</span>
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.05}
          value={draft.settings.ttsRate}
          onChange={(e) => patchSettings({ ttsRate: Number(e.target.value) })}
        />
      </label>

      <label className="field">
        <span className="field-label">Pitch: {draft.settings.ttsPitch.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={draft.settings.ttsPitch}
          onChange={(e) => patchSettings({ ttsPitch: Number(e.target.value) })}
        />
      </label>

      <button type="button" className="secondary" onClick={preview}>
        🔊 Preview voice
      </button>

      <hr className="divider" />

      <label className="field">
        <span className="field-label">
          Match sensitivity: {draft.settings.acceptDistance}
          <span className="field-hint"> (higher = accepts looser matches)</span>
        </span>
        <input
          type="range"
          min={20}
          max={100}
          step={1}
          value={draft.settings.acceptDistance}
          onChange={(e) => patchSettings({ acceptDistance: Number(e.target.value) })}
        />
      </label>

      <label className="field-check">
        <input
          type="checkbox"
          checked={draft.settings.alwaysConfirm}
          onChange={(e) => patchSettings({ alwaysConfirm: e.target.checked })}
        />
        <span>
          Always confirm before speaking
          <span className="field-hint"> (never auto-speak — safest)</span>
        </span>
      </label>

      <label className="field">
        <span className="field-label">
          Caregiver PIN
          <span className="field-hint"> (leave blank for none)</span>
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={draft.settings.pin ?? ''}
          onChange={(e) => patchSettings({ pin: e.target.value.trim() || null })}
          placeholder="e.g. 1234"
        />
      </label>

      <div className="settings-actions">
        <button type="button" className="primary" onClick={() => void save()}>
          Save settings
        </button>
        {saved && <span className="saved-flag">Saved ✓</span>}
      </div>
    </div>
  );
}
