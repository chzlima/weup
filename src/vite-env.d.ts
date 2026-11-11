/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  // Preenchido pela Vercel no build (commit publicado); vazio no PC.
  readonly VERCEL_GIT_COMMIT_SHA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Versão do package.json, injetada pelo vite.config.ts.
declare const __APP_VERSION__: string
