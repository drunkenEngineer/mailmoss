import { useCallback, useState } from 'react'
import { requestToken, revokeToken } from '@/auth/token'
import type { GrantedToken } from '@/auth/token'
import { canChooseAccount, signInWithAccountChooser } from '@/auth/webAuthFlow'
import { createGmailFetch } from '@/core/gmail/client'
import type { GmailProfile } from '@/core/gmail/types'

export type AuthState =
  | { status: 'disconnected' }
  | { status: 'connecting' }
  | { status: 'revoking'; token: string }
  | { status: 'connected'; token: string; profile: GmailProfile; grantedScopes: string[] }
  | { status: 'error'; message: string }

/**
 * Chrome does not always settle getAuthToken when the sign-in window is left
 * open or dismissed — notably when Google refuses the account and renders an
 * error page instead of redirecting. Without a bound the panel waits forever
 * on a window the user may not even realise is open.
 */
const SIGN_IN_TIMEOUT_MS = 90_000

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected failure'
}

async function withTimeout<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('SIGN_IN_TIMED_OUT'))
        }, SIGN_IN_TIMEOUT_MS)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export function useGmailAuth() {
  const [state, setState] = useState<AuthState>({ status: 'disconnected' })

  const signIn = useCallback(async (obtain: () => Promise<GrantedToken>) => {
    setState({ status: 'connecting' })
    try {
      const { token, grantedScopes } = await withTimeout(obtain())
      const profile = await createGmailFetch(token)<GmailProfile>({ path: '/users/me/profile' })
      setState({ status: 'connected', token, profile, grantedScopes })
    } catch (error) {
      setState({ status: 'error', message: messageOf(error) })
    }
  }, [])

  /** Uses whichever account Chrome itself is signed in with. */
  const connect = useCallback(() => signIn(() => requestToken({ interactive: true })), [signIn])

  /** Opens Google's account picker, so another mailbox can be chosen. */
  const connectAs = useCallback(() => signIn(signInWithAccountChooser), [signIn])

  const disconnect = useCallback(async (token: string) => {
    setState({ status: 'revoking', token })
    try {
      await revokeToken(token)
      setState({ status: 'disconnected' })
    } catch (error) {
      setState({ status: 'error', message: messageOf(error) })
    }
  }, [])

  const reset = useCallback(() => {
    setState({ status: 'disconnected' })
  }, [])

  return { state, connect, connectAs, canChooseAccount: canChooseAccount(), disconnect, reset }
}
