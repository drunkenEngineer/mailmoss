import { DEFAULT_SCOPES } from './scopes'
import type { GrantedToken } from './token'

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'

/**
 * `getAuthToken` always uses the account Chrome itself is signed in with and
 * offers no chooser. This flow opens Google's own sign-in page, where
 * `prompt=select_account` shows the account picker, so a second mailbox can be
 * reached from the same browser profile.
 *
 * It uses the implicit flow: the token comes back in the redirect fragment and
 * there is no refresh token, which is the trade-off for not shipping a client
 * secret. Tokens last about an hour, after which the user reconnects.
 */
export function buildAuthUrl(options: {
  clientId: string
  redirectUri: string
  scopes?: readonly string[]
  prompt?: 'select_account' | 'consent' | 'none'
  loginHint?: string
}): string {
  const params = new URLSearchParams({
    client_id: options.clientId,
    response_type: 'token',
    redirect_uri: options.redirectUri,
    scope: (options.scopes ?? DEFAULT_SCOPES).join(' '),
    prompt: options.prompt ?? 'select_account',
    include_granted_scopes: 'true',
  })

  if (options.loginHint !== undefined) params.set('login_hint', options.loginHint)

  return `${AUTH_ENDPOINT}?${params.toString()}`
}

export type TokenFragment = {
  token: string
  grantedScopes: string[]
  expiresInSeconds: number
}

/** The response comes back in the URL fragment, not the query string. */
export function parseTokenFragment(responseUrl: string): TokenFragment | null {
  const hash = responseUrl.split('#')[1]
  if (hash === undefined || hash === '') return null

  const params = new URLSearchParams(hash)
  const token = params.get('access_token')
  if (token === null || token === '') return null

  const expires = Number(params.get('expires_in'))

  return {
    token,
    grantedScopes: params.get('scope')?.split(' ').filter(Boolean) ?? [],
    expiresInSeconds: Number.isFinite(expires) ? expires : 0,
  }
}

export function readAuthError(responseUrl: string): string | null {
  const [, query = ''] = responseUrl.split('?')
  const fromQuery = new URLSearchParams(query.split('#')[0]).get('error')
  if (fromQuery !== null) return fromQuery

  const hash = responseUrl.split('#')[1] ?? ''
  return new URLSearchParams(hash).get('error')
}

export const WEB_CLIENT_ID: string = import.meta.env.VITE_OAUTH_WEB_CLIENT_ID ?? ''

export function canChooseAccount(): boolean {
  return WEB_CLIENT_ID !== ''
}

export async function signInWithAccountChooser(
  scopes: readonly string[] = DEFAULT_SCOPES,
): Promise<GrantedToken> {
  if (!canChooseAccount()) {
    throw new Error('No web OAuth client is configured, so the account chooser is unavailable')
  }

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: buildAuthUrl({
      clientId: WEB_CLIENT_ID,
      redirectUri: chrome.identity.getRedirectURL(),
      scopes,
    }),
    interactive: true,
  })

  if (responseUrl === undefined) throw new Error('Sign-in was closed before it finished')

  const error = readAuthError(responseUrl)
  if (error !== null) throw new Error(`Google refused the sign-in: ${error}`)

  const parsed = parseTokenFragment(responseUrl)
  if (!parsed) throw new Error('Google returned no access token')

  return { token: parsed.token, grantedScopes: parsed.grantedScopes }
}
