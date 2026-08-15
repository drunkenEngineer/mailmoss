import { DEFAULT_SCOPES } from './scopes'

const REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke'

export type GrantedToken = {
  token: string
  grantedScopes: string[]
}

export async function requestToken(options: {
  interactive: boolean
  scopes?: string[]
}): Promise<GrantedToken> {
  const scopes = options.scopes ?? DEFAULT_SCOPES

  const result = await chrome.identity.getAuthToken({
    interactive: options.interactive,
    scopes,
  })

  if (!result.token) {
    throw new Error('Chrome returned no access token')
  }

  return { token: result.token, grantedScopes: result.grantedScopes ?? [] }
}

// Revoking server-side is what actually withdraws the grant; dropping the
// cached copy only makes Chrome forget it locally. Both are needed, in that
// order, or the next sign-in silently reuses the old consent.
export async function revokeToken(token: string): Promise<void> {
  await fetch(REVOKE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }).toString(),
  })

  await chrome.identity.removeCachedAuthToken({ token })
  await chrome.identity.clearAllCachedAuthTokens()
}
