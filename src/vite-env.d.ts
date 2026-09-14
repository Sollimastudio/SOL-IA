/// <reference types="vite/client" />

declare const __JARVIS_BUILD__: string;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SECURE_MEMORY_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
