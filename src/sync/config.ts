/**
 * Sync configuration. The API lives on the same origin as the app (Pages
 * Functions), so the default base is a relative `/api`. The ingest token is
 * baked in at build time from VITE_INGEST_TOKEN.
 */
export const SYNC = {
  apiBase: import.meta.env.VITE_API_BASE ?? '/api',
  ingestToken: import.meta.env.VITE_INGEST_TOKEN ?? '',
  /** Sync is a best-effort background task; failures are retried later. */
  enabled: (import.meta.env.VITE_SYNC_ENABLED ?? 'true') !== 'false',
};
