import { useRef, useState } from 'react'
import { aggregate, sortByIgnored, unreadRate } from '@/core/aggregate/senders'
import type { SenderAggregate } from '@/core/aggregate/senders'
import { createGmailFetch } from '@/core/gmail/client'
import { runScan } from '@/core/scan/runner'
import type { ScanCheckpoint } from '@/core/scan/runner'
import { Mono, ProbeButton, ProbeCard } from './ProbeCard'

export function ScanPanel({ token }: { token: string }) {
  const [running, setRunning] = useState(false)
  const [processed, setProcessed] = useState(0)
  const [label, setLabel] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [senders, setSenders] = useState<SenderAggregate[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [outcome, setOutcome] = useState('')
  const [error, setError] = useState('')
  const [canResume, setCanResume] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const checkpointRef = useRef<ScanCheckpoint | undefined>(undefined)

  async function start(resume: boolean) {
    const controller = new AbortController()
    abortRef.current = controller

    setRunning(true)
    setError('')
    setOutcome('')
    if (!resume) {
      checkpointRef.current = undefined
      setCanResume(false)
      setProcessed(0)
      setSenders([])
      setWarnings([])
    }

    const rows = new Map<string, SenderAggregate>()
    for (const sender of senders) if (resume) rows.set(sender.key, sender)

    const started = Date.now()

    try {
      for await (const event of runScan(
        createGmailFetch(token),
        { signal: controller.signal },
        resume ? checkpointRef.current : undefined,
      )) {
        if (event.type === 'batch') {
          aggregate(event.messages, rows)
          checkpointRef.current = event.checkpoint
          setCanResume(true)
          setLabel(event.label)
          setProcessed(event.checkpoint.processed)
          setElapsed(Date.now() - started)
          setSenders(sortByIgnored([...rows.values()]))
        } else if (event.type === 'warning') {
          setWarnings((previous) => [...previous, `${event.label}: ${event.detail}`])
        } else if (event.type === 'done') {
          setOutcome(`${String(event.processed)} messages, finished as ${event.reason}`)
        }
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unexpected failure'
      if (message.includes('abort')) setOutcome('Cancelled. Resume picks up from the checkpoint.')
      else setError(message)
    } finally {
      setRunning(false)
      abortRef.current = null
    }
  }

  const rate = elapsed > 0 ? ((processed / elapsed) * 1000).toFixed(1) : '0'

  return (
    <ProbeCard
      title="P1 · Scan"
      summary="Runs the real scan: one pass per category, newest first, stopping at the one-year window. Cancelling keeps the checkpoint so Resume continues rather than restarting."
    >
      <div className="flex gap-2">
        <ProbeButton disabled={running} onClick={() => void start(false)}>
          {running ? 'Scanning…' : 'Start scan'}
        </ProbeButton>
        {canResume && !running && (
          <ProbeButton onClick={() => void start(true)}>Resume</ProbeButton>
        )}
        {running && (
          <ProbeButton
            tone="danger"
            onClick={() => {
              abortRef.current?.abort()
            }}
          >
            Cancel
          </ProbeButton>
        )}
      </div>

      {(running || processed > 0) && (
        <Mono>
          {processed} messages · {senders.length} senders · {rate}/s{label !== '' && ` · ${label}`}
        </Mono>
      )}

      {outcome !== '' && <p className="mt-1 text-xs text-slate-600">{outcome}</p>}
      {error !== '' && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {warnings.map((warning) => (
        <p key={warning} className="mt-2 rounded bg-amber-50 p-2 text-[11px] text-amber-800">
          {warning}
        </p>
      ))}

      {senders.length > 0 && (
        <ul className="mt-3 space-y-1">
          {senders.slice(0, 15).map((sender) => (
            <li key={sender.key} className="flex items-baseline justify-between gap-2 text-[11px]">
              <span className="truncate">{sender.displayName || sender.key}</span>
              <span className="shrink-0 font-mono text-slate-500">
                {Math.round(unreadRate(sender) * 100)}% · {sender.totalCount} ·{' '}
                {sender.unsubscribe.method}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ProbeCard>
  )
}
