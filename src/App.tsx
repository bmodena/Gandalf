import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { TopBar } from './ui/TopBar';
import { TalkMode } from './ui/TalkMode';
import { TrainerMode } from './ui/TrainerMode';
import { ConsentGate } from './ui/ConsentGate';
import { EmailGate } from './ui/EmailGate';
import { PinGate } from './ui/PinGate';

export default function App() {
  const ready = useStore((s) => s.ready);
  const profile = useStore((s) => s.profile);
  const mode = useStore((s) => s.mode);
  const trainerUnlocked = useStore((s) => s.trainerUnlocked);
  const init = useStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  // Retry corpus upload whenever the device comes back online.
  useEffect(() => {
    const onOnline = () => void useStore.getState().syncNow();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  if (!ready || !profile) {
    return <div className="loading">Loading…</div>;
  }

  if (!profile.consentAcceptedAt) {
    return <ConsentGate />;
  }

  if (!profile.email) {
    return <EmailGate />;
  }

  const needsPin = mode === 'trainer' && Boolean(profile.settings.pin) && !trainerUnlocked;

  return (
    <div className="app">
      <TopBar />
      <main className="app-main">
        {mode === 'talk' && <TalkMode />}
        {mode === 'trainer' && (needsPin ? <PinGate /> : <TrainerMode />)}
      </main>
    </div>
  );
}
