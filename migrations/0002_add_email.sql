-- Associate each sample with the user's email (lightweight account key).
ALTER TABLE samples ADD COLUMN email TEXT;
CREATE INDEX IF NOT EXISTS idx_samples_email ON samples (email);
