import { create } from 'zustand';
import * as data from '../data/db';
import { buildSeedPhrases, createProfile } from '../data/seed';
import { syncPending } from '../sync/sync';
import type { Phrase, Profile } from '../types';

export type Mode = 'talk' | 'trainer';

// Guards against React StrictMode double-invoking init and creating two profiles.
let initStarted = false;

interface AppState {
  ready: boolean;
  profile: Profile | null;
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
  refreshPhrases: () => Promise<void>;
  refreshTemplateCounts: () => Promise<void>;
  /** Best-effort upload of any not-yet-synced samples to the corpus. */
  syncNow: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  ready: false,
  profile: null,
  phrases: [],
  templateCounts: {},
  mode: 'talk',
  trainerUnlocked: false,

  init: async () => {
    if (initStarted) return;
    initStarted = true;
    let [profile] = await data.getProfiles();
    if (!profile) {
      profile = createProfile('My Voice');
      await data.putProfile(profile);
      for (const phrase of buildSeedPhrases(profile.id)) {
        await data.putPhrase(phrase);
      }
    }
    set({ profile });
    await get().refreshPhrases();
    await get().refreshTemplateCounts();
    set({ ready: true });
    void get().syncNow();
  },

  setMode: (mode) => set({ mode }),
  setTrainerUnlocked: (trainerUnlocked) => set({ trainerUnlocked }),

  saveProfile: async (profile) => {
    await data.putProfile(profile);
    set({ profile });
  },

  acceptConsent: async () => {
    const profile = get().profile;
    if (!profile) return;
    const updated: Profile = { ...profile, consentAcceptedAt: Date.now() };
    await data.putProfile(updated);
    set({ profile: updated });
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
    await syncPending(profile.id, phrases);
  },
}));
