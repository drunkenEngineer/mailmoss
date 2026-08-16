import { useRef, useState } from 'react'
import { aggregate, sortByIgnored, unreadRate } from '@/core/aggregate/senders'
import type { SenderAggregate } from '@/core/aggregate/senders'
import { createGmailFetch } from '@/core/gmail/client'
import { runScan } from '@/core/scan/runner'
import type { ScanCheckpoint } from '@/core/scan/runner'
import { useScanStore } from '../hooks/useScanStore'
import { SCHEMA_VERSION } from '@/storage/schema'
import { Mono, ProbeButton, ProbeCard } from './ProbeCard'

/** Writing on every batch would be wasteful; this is often enough that a crash costs little. */
const SAVE_EVERY = 5

type Store = ReturnType<typeof useScanStore>

export function ScanPanel({ token, email }: { token: string; email: string }) {
  const store = useScanStore(email)

  if (!store.ready) {
    return (
      <ProbeCard title="P1 · Scan" summary="Reading saved progress…">
        <Mono>loading</Mono>
      </ProbeCard>
    )
  }

  // Remounting once storage has been read lets the restored scan seed initial
  // state directly, instead of being synced in through an effect.
  return <LoadedScanPanel key={store.accountHash} token={token} store={store} />
}

function LoadedScanPanel({ token, store }: { token: string; store: Store }) {
  const { accountHash, restored, note, usage, save, clear } = store

  const [running, setRunning] = useState(false)
  const [processed, setProcessed] = useState(restored?.processed ?? 0)
  const [label, setLabel] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [senders, setSenders] = useState<SenderAggregate[]>(() =>
    sortByIgnored(restored?.senders ?? []),
  )
  const [checkpoint, setCheckpoint] = useState<ScanCheckpoint | undefined>(restored?.checkpoint)
  const [warnings, setWarnings] = useState<string[]>([])
  const [outcome, setOutcome] = useState('')
  const [error, setError] = useState('')

  const abortRef = useRef<AbortController | null>(null)

  async function start(resume: boolean) {
    const controller = new AbortController()
    abortRef.current = controller

    setRunning(true)
    setError('')
    setOutcome('')
    if (!resume) {
      setWarnings([])
      setProcessed(0)
      setSenders([])
      setCheckpoint(undefined)
    }

    const rows = new Map(resume ? senders.map((sender) => [sender.key, sender]) : [])
    let live: ScanCheckpoint | undefined = resume ? checkpoint : undefined
    const startedAt = Date.now()
    let batches = 0

    async function persist(done: boolean) {
      await save({
        schemaVersion: SCHEMA_VERSION,
        accountHash,
        startedAt,
        processed: live?.processed ?? 0,
        senders: [...rows.values()],
        ...(done ? { completedAt: Date.now() } : {}),
        ...(live && !done ? { checkpoint: live } : {}),
      })
    }

    try {
      for await (const event of runScan(
        createGmailFetch(token),
        { signal: controller.signal },
        live,
      )) {
        if (event.type === 'batch') {
          aggregate(event.messages, rows)
          live = event.checkpoint
          batches += 1

          setCheckpoint(event.checkpoint)
          setLabel(event.label)
          setProcessed(event.checkpoint.processed)
          setElapsed(Date.now() - startedAt)
          setSenders(sortByIgnored([...rows.values()]))

          if (batches % SAVE_EVERY === 0) await persist(false)
        } else if (event.type === 'warning') {
          setWarnings((previous) => [...previous, `${event.label}: ${event.detail}`])
        } else if (event.type === 'done') {
          setOutcome(`${String(event.processed)} messages, finished as ${event.reason}`)
          live = undefined
          setCheckpoint(undefined)
          await persist(true)
        }
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unexpected failure'
      if (message.toLowerCase().includes('abort')) {
        setOutcome('Cancelled. The checkpoint is saved, so Resume continues from there.')
        await persist(false)
      } else {
        setError(message)
      }
    } finally {
      setRunning(false)
      abortRef.current = null
    }
  }

  const rate = elapsed > 0 ? ((processed / elapsed) * 1000).toFixed(1) : '0'

  return (
    <ProbeCard
      title="P1 · Scan"
      summary="One pass per category, newest first, stopping at the one-year window. Progress is saved, so closing the panel does not lose it."
    >
      <div className="flex flex-wrap gap-2">
        <ProbeButton disabled={running} onClick={() => void start(false)}>
          {running ? 'Scanning…' : 'Start scan'}
        </ProbeButton>
        {checkpoint && !running && (
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
        {!running && senders.length > 0 && (
          <ProbeButton
            onClick={() => {
              setSenders([])
              setProcessed(0)
              setCheckpoint(undefined)
              void clear()
            }}
          >
            Clear saved
          </ProbeButton>
        )}
      </div>

      {note !== '' && <Mono>{note}</Mono>}

      {(running || processed > 0) && (
        <Mono>
          {processed} messages · {senders.length} senders
          {/* Restored counts carry no timing, so a rate would read as 0/s. */}
          {elapsed > 0 && ` · ${rate}/s`}
          {label !== '' && ` · ${label}`}
        </Mono>
      )}

      <Mono>
        storage {(usage.bytes / 1024).toFixed(1)} KB · {(usage.ratio * 100).toFixed(2)}% of quota
        {usage.warn && ' — approaching the limit'}
      </Mono>

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
            <li key={sender.key} className="text-[11px]">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate">{sender.displayName || sender.key}</span>
                <span className="shrink-0 font-mono text-slate-500">
                  {Math.round(unreadRate(sender) * 100)}% · {sender.totalCount} ·{' '}
                  {sender.unsubscribe.method}
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">{sender.key}</span>
            </li>
          ))}
        </ul>
      )}
    </ProbeCard>
  )
}
