import { describe, expect, it } from 'vitest'
import { buildAuthUrl, parseTokenFragment, readAuthError } from '@/auth/webAuthFlow'

const REDIRECT = 'https://abc.chromiumapp.org/'

describe('buildAuthUrl', () => {
  const url = buildAuthUrl({ clientId: 'cid', redirectUri: REDIRECT })
  const params = new URL(url).searchParams

  it('points at Google and asks for a token directly', () => {
    expect(url.startsWith('https://accounts.google.com/o/oauth2/v2/auth')).toBe(true)
    expect(params.get('response_type')).toBe('token')
  })

  it('asks for the account picker, which is the whole point', () => {
    expect(params.get('prompt')).toBe('select_account')
  })

  it('carries the client, redirect and default scope', () => {
    expect(params.get('client_id')).toBe('cid')
    expect(params.get('redirect_uri')).toBe(REDIRECT)
    expect(params.get('scope')).toContain('gmail.metadata')
  })

  it('passes a login hint only when given one', () => {
    expect(params.get('login_hint')).toBeNull()
    const hinted = buildAuthUrl({ clientId: 'c', redirectUri: REDIRECT, loginHint: 'a@b.fr' })
    expect(new URL(hinted).searchParams.get('login_hint')).toBe('a@b.fr')
  })

  it('allows a different prompt and scopes', () => {
    const silent = buildAuthUrl({
      clientId: 'c',
      redirectUri: REDIRECT,
      prompt: 'none',
      scopes: ['scope-a', 'scope-b'],
    })
    const silentParams = new URL(silent).searchParams
    expect(silentParams.get('prompt')).toBe('none')
    expect(silentParams.get('scope')).toBe('scope-a scope-b')
  })
})

describe('parseTokenFragment', () => {
  it('reads the token, scopes and lifetime from the fragment', () => {
    const result = parseTokenFragment(
      `${REDIRECT}#access_token=ya29.abc&token_type=Bearer&expires_in=3599&scope=a%20b`,
    )

    expect(result).toEqual({
      token: 'ya29.abc',
      grantedScopes: ['a', 'b'],
      expiresInSeconds: 3599,
    })
  })

  it('copes with a missing scope or lifetime', () => {
    const result = parseTokenFragment(`${REDIRECT}#access_token=t`)
    expect(result?.grantedScopes).toEqual([])
    expect(result?.expiresInSeconds).toBe(0)
  })

  it('returns null when there is no token', () => {
    expect(parseTokenFragment(REDIRECT)).toBeNull()
    expect(parseTokenFragment(`${REDIRECT}#`)).toBeNull()
    expect(parseTokenFragment(`${REDIRECT}#error=access_denied`)).toBeNull()
  })
})

describe('readAuthError', () => {
  it('finds an error in the query or the fragment', () => {
    expect(readAuthError(`${REDIRECT}?error=access_denied`)).toBe('access_denied')
    expect(readAuthError(`${REDIRECT}#error=access_denied`)).toBe('access_denied')
  })

  it('reports nothing on a successful redirect', () => {
    expect(readAuthError(`${REDIRECT}#access_token=t`)).toBeNull()
  })
})
