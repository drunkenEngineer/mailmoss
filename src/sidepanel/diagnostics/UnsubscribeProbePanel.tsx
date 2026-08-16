import { useEffect, useState } from 'react'
import { hasBroadHostAccess, requestBroadHostAccess } from '@/auth/permissions'
import { aggregate } from '@/core/aggregate/senders'
import type { SenderAggregate } from '@/core/aggregate/senders'
import { createGmailFetch } from '@/core/gmail/client'
import { SCAN_LABELS, fetchMetadata, listMessageIds } from '@/core/gmail/collect'
import { sendOneClick } from '@/core/unsubscribe/oneClick'
import type { OneClickResult } from '@/core/unsubscribe/oneClick'
import { Mono, ProbeButton, ProbeCard } from './ProbeCard'

const SAMPLE_SIZE = 120
const NEUTRAL_TARGET = 'https://example.com/'

export function UnsubscribeProbePanel({ token }: { token: string }) {
  const [granted, setGranted] = useState<boolean | null>(null)
  const [reach, setReach] = useState('')
  const [candidates, setCandidates] = useState<SenderAggregate[]>([])
  const [busy, setBusy] = useState('')
  const [armed, setArmed] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, OneClickResult>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    hasBroadHostAccess()
      .then(setGranted)
      .catch(() => {
        setGranted(false)
      })
  }, [])

  async function requestAccess() {
    try {
      setGranted(await requestBroadHostAccess())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Permission request failed')
    }
  }

  // Reads a harmless page to establish whether host permissions actually unlock
  // cross-origin requests from the panel. No side effects on anyone's account.
  async function testReach() {
    setReach('testing…')
    try {
      const response = await fetch(NEUTRAL_TARGET, { method: 'GET' })
      setReach(`reachable, status ${String(response.status)}`)
    } catch (cause) {
      setReach(`blocked: ${cause instanceof Error ? cause.message : 'unknown'}`)
    }
  }

  async function findCandidates() {
    setBusy('Sampling messages…')
    setError('')
    try {
      const gmailFetch = createGmailFetch(token)
      const ids: string[] = []

      for (const label of SCAN_LABELS) {
        if (ids.length >= SAMPLE_SIZE) break
        const refs = await listMessageIds(gmailFetch, {
          labelId: label,
          limit: SAMPLE_SIZE - ids.length,
        })
        ids.push(...refs.map((ref) => ref.id))
      }

      const messages = await fetchMetadata(gmailFetch, ids, { concurrency: 10 })
      const senders = [...aggregate(messages).values()]
      setCandidates(senders.filter((sender) => sender.unsubscribe.method === 'one-click'))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unexpected failure')
    } finally {
      setBusy('')
    }
  }

  async function confirmUnsubscribe(sender: SenderAggregate) {
    const target = sender.unsubscribe.target
    if (target === undefined) return

    setArmed(null)
    setBusy(`Unsubscribing from ${sender.key}…`)
    const result = await sendOneClick(target)
    setResults((previous) => ({ ...previous, [sender.key]: result }))
    setBusy('')
  }

  return (
    <ProbeCard
      title="S-3 · One-click"
      summary="Whether an RFC 8058 POST succeeds from the extension, and what happens when host access is refused."
    >
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium">
            1. Host access:{' '}
            <span className={granted === true ? 'text-green-600' : 'text-slate-500'}>
              {granted === null ? 'checking…' : granted ? 'granted' : 'not granted'}
            </span>
          </p>
          {granted === false && (
            <div className="mt-1">
              <ProbeButton onClick={() => void requestAccess()}>Request host access</ProbeButton>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium">2. Cross-origin reach</p>
          <p className="text-xs text-slate-500">
            Reads {NEUTRAL_TARGET} only. Nothing is changed anywhere.
          </p>
          <div className="mt-1">
            <ProbeButton onClick={() => void testReach()}>Test reach</ProbeButton>
          </div>
          {reach !== '' && <Mono>{reach}</Mono>}
        </div>

        <div>
          <p className="text-xs font-medium">3. Senders offering one-click</p>
          <div className="mt-1">
            <ProbeButton disabled={busy !== ''} onClick={() => void findCandidates()}>
              {busy !== '' ? 'Working…' : `Sample ${String(SAMPLE_SIZE)} messages`}
            </ProbeButton>
          </div>
          {busy !== '' && <Mono>{busy}</Mono>}
          {error !== '' && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>

        {candidates.length > 0 && (
          <div className="rounded border border-red-200 bg-red-50 p-2">
            <p className="text-xs font-semibold text-red-800">
              4. This step really unsubscribes you
            </p>
            <p className="mt-1 text-xs text-red-700">
              These are your actual subscriptions. A successful call is a real unsubscribe and
              cannot be undone from here. Pick one you genuinely no longer want.
            </p>

            <ul className="mt-2 space-y-2">
              {candidates.map((sender) => {
                const result = results[sender.key]
                return (
                  <li key={sender.key} className="rounded border border-red-200 bg-white p-2">
                    <p className="text-xs font-medium break-words">
                      {sender.displayName || sender.key}
                    </p>
                    <Mono>{sender.key}</Mono>

                    {result ? (
                      <p
                        className={`mt-1 text-xs ${result.ok ? 'text-green-700' : 'text-red-600'}`}
                      >
                        {result.status} · {result.detail}
                      </p>
                    ) : armed === sender.key ? (
                      <div className="mt-1 flex gap-2">
                        <ProbeButton tone="danger" onClick={() => void confirmUnsubscribe(sender)}>
                          Yes, unsubscribe me
                        </ProbeButton>
                        <ProbeButton
                          onClick={() => {
                            setArmed(null)
                          }}
                        >
                          Cancel
                        </ProbeButton>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <ProbeButton
                          tone="danger"
                          onClick={() => {
                            setArmed(sender.key)
                          }}
                        >
                          Send one-click POST
                        </ProbeButton>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </ProbeCard>
  )
}
