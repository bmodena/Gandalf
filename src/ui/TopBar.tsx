import { useStore } from '../store/useStore';

export function TopBar() {
  const mode = useStore((s) => s.mode);
  const profile = useStore((s) => s.profile);
  const setMode = useStore((s) => s.setMode);
  const setTrainerUnlocked = useStore((s) => s.setTrainerUnlocked);

  const goTalk = () => {
    setMode('talk');
    setTrainerUnlocked(false);
  };

  const goTrainer = () => {
    setMode('trainer');
    if (!profile?.settings.pin) setTrainerUnlocked(true);
  };

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="topbar-title">🧙 gandalf</div>
        {profile?.name && <div className="topbar-user">{profile.name}</div>}
      </div>
      <nav className="topbar-modes" aria-label="Mode">
        <button
          type="button"
          className={`mode-btn ${mode === 'talk' ? 'active' : ''}`}
          onClick={goTalk}
        >
          Talk
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === 'trainer' ? 'active' : ''}`}
          onClick={goTrainer}
        >
          Setup
        </button>
      </nav>
    </header>
  );
}
