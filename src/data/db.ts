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

/** Delete a profile and everything belonging to it (phrases + templates). */
export async function deleteProfile(profileId: string): Promise<void> {
  const database = await db();
  const phrases = await database.getAllFromIndex('phrases', 'byProfile', profileId);
  const templates = await database.getAllFromIndex('templates', 'byProfile', profileId);
  const tx = database.transaction(['profiles', 'phrases', 'templates'], 'readwrite');
  await tx.objectStore('profiles').delete(profileId);
  for (const p of phrases) await tx.objectStore('phrases').delete(p.id);
  for (const t of templates) await tx.objectStore('templates').delete(t.id);
  await tx.done;
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

/** Templates that have local audio but haven't been uploaded to the corpus yet. */
export async function getUnsyncedTemplates(profileId: string): Promise<Template[]> {
  const all = await getTemplatesForProfile(profileId);
  return all.filter((t) => t.audio instanceof Blob && !t.synced);
}

/** Mark a template as uploaded (keeps the local audio for now). */
export async function markTemplateSynced(templateId: string): Promise<void> {
  const database = await db();
  const template = await database.get('templates', templateId);
  if (!template) return;
  await database.put('templates', { ...template, synced: true });
}
