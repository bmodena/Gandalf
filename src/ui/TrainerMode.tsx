import { useState } from 'react';
import { PhraseManager } from './PhraseManager';
import { VoiceSettings } from './VoiceSettings';

type Tab = 'phrases' | 'voice';

export function TrainerMode() {
  const [tab, setTab] = useState<Tab>('phrases');

  return (
    <div className="trainer">
      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'phrases'}
          className={tab === 'phrases' ? 'active' : ''}
          onClick={() => setTab('phrases')}
        >
          Phrases &amp; Training
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'voice'}
          className={tab === 'voice' ? 'active' : ''}
          onClick={() => setTab('voice')}
        >
          Voice &amp; Settings
        </button>
      </div>
      {tab === 'phrases' ? <PhraseManager /> : <VoiceSettings />}
    </div>
  );
}
