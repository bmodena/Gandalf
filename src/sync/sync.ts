import * as data from '../data/db';
import type { Phrase, Profile, Template } from '../types';
import { SYNC } from './config';

/**
 * Background sync of enrolled samples to the central corpus (Cloudflare Pages
 * Functions → R2 + D1). Local-first: samples are always stored on-device first;
 * this uploads any that haven't synced yet, and is safe to call often. Failures
 * (offline, server down) leave the sample marked unsynced so it retries later.
 */

let running = false;

export async function syncPending(profile: Profile, phrases: Phrase[]): Promise<void> {
  if (!SYNC.enabled || running) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

  running = true;
  try {
    const pending = await data.getUnsyncedTemplates(profile.id);
    if (pending.length === 0) return;

    const phraseById = new Map(phrases.map((p) => [p.id, p]));
    for (const template of pending) {
      const uploaded = await uploadTemplate(template, phraseById.get(template.phraseId), profile.email);
      if (uploaded) await data.markTemplateSynced(template.id);
    }
  } finally {
    running = false;
  }
}

async function uploadTemplate(
  template: Template,
  phrase: Phrase | undefined,
  email: string | undefined,
): Promise<boolean> {
  if (!(template.audio instanceof Blob)) return true; // nothing to upload

  try {
    const form = new FormData();
    form.append('audio', template.audio, `${template.id}.wav`);
    form.append(
      'meta',
      JSON.stringify({
        id: template.id,
        profileId: template.profileId,
        email: email ?? null,
        phraseId: template.phraseId,
        phraseText: phrase?.text ?? '',
        category: phrase?.category ?? null,
        labelSource: template.source,
        durationMs: template.durationMs,
        sampleRate: template.sampleRate ?? null,
        clientCreatedAt: template.createdAt,
      }),
    );

    const res = await fetch(`${SYNC.apiBase}/samples`, {
      method: 'POST',
      headers: SYNC.ingestToken ? { 'x-ingest-token': SYNC.ingestToken } : {},
      body: form,
    });
    return res.ok;
  } catch (err) {
    console.debug('sync: upload failed, will retry later', err);
    return false;
  }
}
