import { useState } from 'react';
import { UsersPanel } from './UsersPanel';
import { PhraseManager } from './PhraseManager';
import { VoiceSettings } from './VoiceSettings';

type Tab = 'users' | 'phrases' | 'voice';

const TABS: { id: Tab; label: string }[] = [
  { id: 'users', label: 'Users' },
  { id: 'phrases', label: 'Phrases' },
  { id: 'voice', label: 'Voice' },
];

export function TrainerMode() {
  const [tab, setTab] = useState<Tab>('phrases');

  return (
    <div className="trainer">
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'users' && <UsersPanel />}
      {tab === 'phrases' && <PhraseManager />}
      {tab === 'voice' && <VoiceSettings />}
    </div>
  );
}
