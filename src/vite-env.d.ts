/// <reference types="vite/client" />

/**
 * Vite types `import.meta.env` entries as `any` by default. Declaring the ones
 * this project reads keeps them typed and makes the full list visible in one
 * place. All are build-time values; see .env.example.
 */
interface ImportMetaEnv {
  /** OAuth client of type "Chrome Extension", used by chrome.identity.getAuthToken. */
  readonly VITE_OAUTH_CLIENT_ID?: string
  /** OAuth client of type "Web application", used by the account chooser flow. */
  readonly VITE_OAUTH_WEB_CLIENT_ID?: string
  /** Base64 public key that pins the extension ID across reloads. */
  readonly VITE_EXTENSION_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
