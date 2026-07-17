/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_INGEST_TOKEN?: string;
  readonly VITE_API_BASE?: string;
  readonly VITE_SYNC_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
