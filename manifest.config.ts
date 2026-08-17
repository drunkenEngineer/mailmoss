import { defineManifest } from '@crxjs/vite-plugin'
import { DEFAULT_SCOPES } from './src/auth/scopes.ts'

const ICONS = {
  16: 'icons/icon-16.png',
  32: 'icons/icon-32.png',
  48: 'icons/icon-48.png',
  128: 'icons/icon-128.png',
}

// client_id and key come from .env — see .env.example. Without a fixed key the
// extension ID changes on every reload, which breaks the OAuth client binding.
export function buildManifest(env: Record<string, string>) {
  const clientId = env.VITE_OAUTH_CLIENT_ID
  const key = env.VITE_EXTENSION_KEY

  return defineManifest({
    manifest_version: 3,
    name: '__MSG_extName__',
    version: '0.0.1',
    description: '__MSG_extDescription__',
    default_locale: 'en',

    ...(key ? { key } : {}),
    ...(clientId ? { oauth2: { client_id: clientId, scopes: DEFAULT_SCOPES } } : {}),

    permissions: ['identity', 'storage', 'sidePanel', 'tabs'],
    host_permissions: ['https://gmail.googleapis.com/*', 'https://oauth2.googleapis.com/*'],
    optional_host_permissions: ['*://*/*'],

    background: {
      service_worker: 'src/background/index.ts',
      type: 'module',
    },
    side_panel: {
      default_path: 'src/sidepanel/index.html',
    },
    // Generated from assets/logo.svg by `npm run icons`. Do not hand-edit.
    icons: ICONS,
    action: {
      default_title: '__MSG_extName__',
      default_icon: ICONS,
    },
  })
}
