import { create } from 'zustand';
import * as data from '../data/db';
import { buildSeedPhrases, createProfile } from '../data/seed';
import { syncPending } from '../sync/sync';
import type { Phrase, Profile } from '../types';

export type Mode = 'talk' | 'trainer';

// Guards against React StrictMode double-invoking init and creating two profiles.
let initStarted = false;

const ACTIVE_KEY = 'gandalf.activeProfileId';
function getStoredActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}
function setStoredActiveId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    /* ignore */
  }
}

async function createSeededProfile(name: string): Promise<Profile> {
  const profile = createProfile(name);
  await data.putProfile(profile);
  for (const phrase of buildSeedPhrases(profile.id)) await data.putPhrase(phrase);
  return profile;
}

interface AppState {
  ready: boolean;
  /** The person currently using the app. */
  profile: Profile | null;
  /** All people set up on this device. */
  profiles: Profile[];
  phrases: Phrase[];
  /** phraseId -> number of enrolled templates. */
  templateCounts: Record<string, number>;
  mode: Mode;
  trainerUnlocked: boolean;

  init: () => Promise<void>;
  setMode: (mode: Mode) => void;
  setTrainerUnlocked: (unlocked: boolean) => void;
  saveProfile: (profile: Profile) => Promise<void>;
  acceptConsent: () => Promise<void>;
  setEmail: (email: string) => Promise<void>;
  refreshPhrases: () => Promise<void>;
  refreshTemplateCounts: () => Promise<void>;
  /** Best-effort upload of any not-yet-synced samples to the corpus. */
  syncNow: () => Promise<void>;

  // Multi-user
  switchProfile: (id: string) => Promise<void>;
  addProfile: (name: string, email: string) => Promise<void>;
  renameProfile: (id: string, name: string) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  ready: false,
  profile: null,
  profiles: [],
  phrases: [],
  templateCounts: {},
  mode: 'talk',
  trainerUnlocked: false,

  init: async () => {
    if (initStarted) return;
    initStarted = true;
    let profiles = await data.getProfiles();
    if (profiles.length === 0) {
      profiles = [await createSeededProfile('My Voice')];
    }
    const storedId = getStoredActiveId();
    const active = profiles.find((p) => p.id === storedId) ?? profiles[0];
    setStoredActiveId(active.id);
    set({ profiles, profile: active });
    await get().refreshPhrases();
    await get().refreshTemplateCounts();
    set({ ready: true });
    void get().syncNow();
  },

  setMode: (mode) => set({ mode }),
  setTrainerUnlocked: (trainerUnlocked) => set({ trainerUnlocked }),

  saveProfile: async (profile) => {
    await data.putProfile(profile);
    const isActive = get().profile?.id === profile.id;
    set({
      profile: isActive ? profile : get().profile,
      profiles: get().profiles.map((p) => (p.id === profile.id ? profile : p)),
    });
  },

  acceptConsent: async () => {
    const profile = get().profile;
    if (!profile) return;
    await get().saveProfile({ ...profile, consentAcceptedAt: Date.now() });
  },

  setEmail: async (email) => {
    const profile = get().profile;
    if (!profile) return;
    await get().saveProfile({ ...profile, email: email.trim() });
  },

  refreshPhrases: async () => {
    const profile = get().profile;
    if (!profile) return;
    const phrases = (await data.getPhrases(profile.id)).sort((a, b) => a.order - b.order);
    set({ phrases });
  },

  refreshTemplateCounts: async () => {
    const profile = get().profile;
    if (!profile) return;
    const templates = await data.getTemplatesForProfile(profile.id);
    const counts: Record<string, number> = {};
    for (const t of templates) counts[t.phraseId] = (counts[t.phraseId] ?? 0) + 1;
    set({ templateCounts: counts });
  },

  syncNow: async () => {
    const { profile, phrases } = get();
    if (!profile) return;
    await syncPending(profile, phrases);
  },

  switchProfile: async (id) => {
    const target = get().profiles.find((p) => p.id === id);
    if (!target || target.id === get().profile?.id) return;
    setStoredActiveId(id);
    set({ profile: target });
    await get().refreshPhrases();
    await get().refreshTemplateCounts();
    void get().syncNow();
  },

  addProfile: async (name, email) => {
    const profile = await createSeededProfile(name.trim() || 'New user');
    profile.email = email.trim() || undefined;
    profile.consentAcceptedAt = Date.now(); // caregiver is deliberately adding this person
    await data.putProfile(profile);
    set({ profiles: [...get().profiles, profile] });
    await get().switchProfile(profile.id);
  },

  renameProfile: async (id, name) => {
    const target = get().profiles.find((p) => p.id === id);
    const trimmed = name.trim();
    if (!target || !trimmed) return;
    await get().saveProfile({ ...target, name: trimmed });
  },

  deleteProfile: async (id) => {
    await data.deleteProfile(id);
    let profiles = await data.getProfiles();
    if (profiles.length === 0) {
      profiles = [await createSeededProfile('My Voice')];
    }
    set({ profiles });
    if (get().profile?.id === id) {
      // Force a reload of the newly-active profile's data.
      set({ profile: null });
      await get().switchProfile(profiles[0].id);
    }
  },
}));
