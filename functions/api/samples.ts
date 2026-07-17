// POST /api/samples — receive one enrolled voice sample.
// Audio bytes go to R2; labeled metadata goes to D1.
//
// Types are declared loosely here because Pages Functions are bundled by
// wrangler (not by the app's tsconfig), so we avoid pulling in
// @cloudflare/workers-types just for editor hints.

interface Env {
  DB: {
    prepare: (sql: string) => {
      bind: (...args: unknown[]) => { run: () => Promise<unknown> };
    };
  };
  AUDIO: {
    put: (key: string, value: ArrayBuffer, opts?: unknown) => Promise<unknown>;
  };
  INGEST_TOKEN?: string;
}

interface Context {
  request: Request;
  env: Env;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const onRequestPost = async (context: Context): Promise<Response> => {
  const { request, env } = context;

  // Auth: if the server has a token configured, require a matching header.
  if (env.INGEST_TOKEN) {
    if (request.headers.get('x-ingest-token') !== env.INGEST_TOKEN) {
      return json({ error: 'unauthorized' }, 401);
    }
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'expected multipart/form-data' }, 400);
  }

  const audio = form.get('audio');
  const metaRaw = form.get('meta');
  if (!(audio instanceof Blob) || typeof metaRaw !== 'string') {
    return json({ error: 'missing audio or meta' }, 400);
  }

  let meta: Record<string, unknown>;
  try {
    meta = JSON.parse(metaRaw);
  } catch {
    return json({ error: 'invalid meta json' }, 400);
  }

  const str = (v: unknown): string => (typeof v === 'string' ? v : '');
  const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);

  const id = str(meta.id) || crypto.randomUUID();
  const profileId = str(meta.profileId);
  const phraseId = str(meta.phraseId);
  if (!profileId || !phraseId) return json({ error: 'missing profileId or phraseId' }, 400);

  const audioKey = `${profileId}/${phraseId}/${id}.wav`;

  try {
    await env.AUDIO.put(audioKey, await audio.arrayBuffer(), {
      httpMetadata: { contentType: 'audio/wav' },
    });

    await env.DB.prepare(
      `INSERT OR REPLACE INTO samples
        (id, profile_id, email, phrase_id, phrase_text, category, label_source,
         duration_ms, sample_rate, audio_key, audio_format, client_created_at, created_at, user_agent)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
      .bind(
        id,
        profileId,
        str(meta.email) || null,
        phraseId,
        str(meta.phraseText),
        str(meta.category) || null,
        str(meta.labelSource) || 'enroll',
        num(meta.durationMs),
        num(meta.sampleRate),
        audioKey,
        'wav',
        num(meta.clientCreatedAt),
        Date.now(),
        request.headers.get('user-agent'),
      )
      .run();
  } catch (err) {
    return json({ error: 'storage failed', detail: String(err) }, 500);
  }

  return json({ ok: true, id, audioKey });
};
