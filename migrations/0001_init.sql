-- Central corpus of enrolled voice samples for training + backup.
-- Audio bytes live in R2; this table holds the labeled metadata.

CREATE TABLE IF NOT EXISTS samples (
  id                TEXT PRIMARY KEY,     -- matches the client template id
  profile_id        TEXT NOT NULL,        -- which voice/person
  phrase_id         TEXT NOT NULL,
  phrase_text       TEXT NOT NULL,        -- denormalized label for easy training exports
  category          TEXT,
  label_source      TEXT NOT NULL,        -- 'enroll' | 'correction'
  duration_ms       INTEGER,
  sample_rate       INTEGER,
  audio_key         TEXT NOT NULL,        -- R2 object key
  audio_format      TEXT DEFAULT 'wav',
  client_created_at INTEGER,              -- when recorded on device
  created_at        INTEGER NOT NULL,     -- when the server received it
  user_agent        TEXT
);

CREATE INDEX IF NOT EXISTS idx_samples_profile ON samples (profile_id);
CREATE INDEX IF NOT EXISTS idx_samples_phrase ON samples (phrase_id);
