import { useCallback, useState } from 'react'
import { requestToken, revokeToken } from '@/auth/token'
import { createGmailFetch } from '@/core/gmail/client'
import type { GmailProfile } from '@/core/gmail/types'

export type AuthState =
  | { status: 'disconnected' }
  | { status: 'connecting' }
  | { status: 'revoking'; token: string }
  | { status: 'connected'; token: string; profile: GmailProfile; grantedScopes: string[] }
  | { status: 'error'; message: string }

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected failure'
}

export function useGmailAuth() {
  const [state, setState] = useState<AuthState>({ status: 'disconnected' })

  const connect = useCallback(async () => {
    setState({ status: 'connecting' })
    try {
      const { token, grantedScopes } = await requestToken({ interactive: true })
      const profile = await createGmailFetch(token)<GmailProfile>({ path: '/users/me/profile' })
      setState({ status: 'connected', token, profile, grantedScopes })
    } catch (error) {
      setState({ status: 'error', message: messageOf(error) })
    }
  }, [])

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

  return { state, connect, disconnect, reset }
}
