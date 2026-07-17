import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Phrase, Profile, Template } from '../types';

/**
 * Local-first storage. Everything — the profile, phrase library, and the voice
 * templates that make the app personal — lives on-device in IndexedDB and never
 * leaves the device.
 */

interface GandalfDB extends DBSchema {
  profiles: { key: string; value: Profile };
  phrases: { key: string; value: Phrase; indexes: { byProfile: string } };
  templates: {
    key: string;
    value: Template;
    indexes: { byPhrase: string; byProfile: string };
  };
}

let instance: Promise<IDBPDatabase<GandalfDB>> | null = null;

function db(): Promise<IDBPDatabase<GandalfDB>> {
  if (!instance) {
    instance = openDB<GandalfDB>('gandalf', 1, {
      upgrade(database) {
        database.createObjectStore('profiles', { keyPath: 'id' });
        const phrases = database.createObjectStore('phrases', { keyPath: 'id' });
        phrases.createIndex('byProfile', 'profileId');
        const templates = database.createObjectStore('templates', { keyPath: 'id' });
        templates.createIndex('byPhrase', 'phraseId');
        templates.createIndex('byProfile', 'profileId');
      },
    });
  }
  return instance;
}

// --- Profiles ---------------------------------------------------------------

export async function getProfiles(): Promise<Profile[]> {
  return (await db()).getAll('profiles');
}

export async function putProfile(profile: Profile): Promise<void> {
  await (await db()).put('profiles', profile);
}

// --- Phrases ----------------------------------------------------------------

export async function getPhrases(profileId: string): Promise<Phrase[]> {
  return (await db()).getAllFromIndex('phrases', 'byProfile', profileId);
}

export async function putPhrase(phrase: Phrase): Promise<void> {
  await (await db()).put('phrases', phrase);
}

/** Delete a phrase and every template belonging to it. */
export async function deletePhrase(phraseId: string): Promise<void> {
  const database = await db();
  const templates = await database.getAllFromIndex('templates', 'byPhrase', phraseId);
  const tx = database.transaction(['phrases', 'templates'], 'readwrite');
  await tx.objectStore('phrases').delete(phraseId);
  for (const t of templates) await tx.objectStore('templates').delete(t.id);
  await tx.done;
}

// --- Templates --------------------------------------------------------------

export async function getTemplatesForPhrase(phraseId: string): Promise<Template[]> {
  return (await db()).getAllFromIndex('templates', 'byPhrase', phraseId);
}

export async function getTemplatesForProfile(profileId: string): Promise<Template[]> {
  return (await db()).getAllFromIndex('templates', 'byProfile', profileId);
}

export async function putTemplate(template: Template): Promise<void> {
  await (await db()).put('templates', template);
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await (await db()).delete('templates', templateId);
}
