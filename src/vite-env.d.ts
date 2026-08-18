/// <reference types="vite/client" />

/** Commit this bundle was built from. Defined in vite.config.ts. */
declare const __BUILD_SHA__: string

/** Application version from package.json. Defined in vite.config.ts. */
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  /**
   * Sentry DSN. Set on Vercel for Production only, so local dev and preview
   * deployments run without error monitoring.
   */
  readonly VITE_SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
