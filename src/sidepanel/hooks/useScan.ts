import { useCallback, useRef, useState } from 'react'
import { aggregate } from '@/core/aggregate/senders'
import type { SenderAggregate, SenderStatus } from '@/core/aggregate/senders'
import { createGmailFetch } from '@/core/gmail/client'
import { GmailError } from '@/core/gmail/errors'
import { runScan } from '@/core/scan/runner'
import type { ScanCheckpoint } from '@/core/scan/runner'
import { SCHEMA_VERSION } from '@/storage/schema'
import type { useScanStore } from './useScanStore'

export type ScanPhase = 'idle' | 'scanning' | 'done' | 'cancelled' | 'error'

export type ScanFailure = 'auth' | 'network' | 'rate' | 'unknown'

const SAVE_EVERY = 5
const ALL_TIME_DAYS = 20 * 365

function failureOf(error: unknown): ScanFailure {
  if (!(error instanceof GmailError)) return 'unknown'
  if (error.kind === 'auth') return 'auth'
  if (error.kind === 'network') return 'network'
  if (error.kind === 'rate-limit') return 'rate'
  return 'unknown'
}

export function useScan(token: string, store: ReturnType<typeof useScanStore>) {
  const { accountHash, restored, save, clear } = store

  const [senders, setSenders] = useState<SenderAggregate[]>(() => restored?.senders ?? [])
  const [checkpoint, setCheckpoint] = useState<ScanCheckpoint | undefined>(restored?.checkpoint)
  const [processed, setProcessed] = useState(restored?.processed ?? 0)
  const [phase, setPhase] = useState<ScanPhase>(() => {
    if (!restored) return 'idle'
    return restored.checkpoint ? 'cancelled' : 'done'
  })
  const [failure, setFailure] = useState<ScanFailure | null>(null)
  const [label, setLabel] = useState('')
  const [rate, setRate] = useState(0)
  const [outOfOrder, setOutOfOrder] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  const persist = useCallback(
    async (rows: SenderAggregate[], live: ScanCheckpoint | undefined, startedAt: number) => {
      await save({
        schemaVersion: SCHEMA_VERSION,
        accountHash,
        startedAt,
        processed: live?.processed ?? 0,
        senders: rows,
        ...(live ? { checkpoint: live } : { completedAt: Date.now() }),
      })
    },
    [accountHash, save],
  )

  const run = useCallback(
    async (options: { resume: boolean; allTime: boolean }) => {
      const controller = new AbortController()
      abortRef.current = controller

      setPhase('scanning')
      setFailure(null)
      setOutOfOrder(false)

      const rows = new Map(options.resume ? senders.map((sender) => [sender.key, sender]) : [])
      let live: ScanCheckpoint | undefined = options.resume ? checkpoint : undefined
      if (!options.resume) {
        setSenders([])
        setProcessed(0)
      }

      const startedAt = Date.now()
      let batches = 0

      try {
        for await (const event of runScan(
          createGmailFetch(token),
          {
            signal: controller.signal,
            ...(options.allTime ? { windowDays: ALL_TIME_DAYS } : {}),
          },
          live,
        )) {
          if (event.type === 'batch') {
            aggregate(event.messages, rows)
            live = event.checkpoint
            batches += 1

            const snapshot = [...rows.values()]
            setSenders(snapshot)
            setCheckpoint(event.checkpoint)
            setProcessed(event.checkpoint.processed)
            setLabel(event.label)
            setRate((event.checkpoint.processed / Math.max(1, Date.now() - startedAt)) * 1000)

            if (batches % SAVE_EVERY === 0) await persist(snapshot, live, startedAt)
          } else if (event.type === 'warning') {
            setOutOfOrder(true)
          } else if (event.type === 'done') {
            live = undefined
            setCheckpoint(undefined)
            setProcessed(event.processed)
            setPhase('done')
            await persist([...rows.values()], undefined, startedAt)
          }
        }
      } catch (error) {
        const aborted =
          controller.signal.aborted ||
          (error instanceof Error && error.message.toLowerCase().includes('abort'))

        if (aborted) {
          setPhase('cancelled')
          await persist([...rows.values()], live, startedAt)
        } else {
          setFailure(failureOf(error))
          setPhase('error')
        }
      } finally {
        abortRef.current = null
      }
    },
    [checkpoint, persist, senders, token],
  )

  const start = useCallback((allTime: boolean) => run({ resume: false, allTime }), [run])

  const resume = useCallback((allTime: boolean) => run({ resume: true, allTime }), [run])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const markStatus = useCallback(
    async (keys: readonly string[], status: SenderStatus) => {
      const wanted = new Set(keys)
      const next = senders.map((sender) =>
        wanted.has(sender.key) ? { ...sender, status } : sender,
      )
      setSenders(next)
      await persist(next, checkpoint, Date.now())
    },
    [checkpoint, persist, senders],
  )

  const reset = useCallback(async () => {
    setSenders([])
    setProcessed(0)
    setCheckpoint(undefined)
    setPhase('idle')
    await clear()
  }, [clear])

  return {
    senders,
    processed,
    phase,
    failure,
    label,
    rate,
    outOfOrder,
    canResume: checkpoint !== undefined,
    start,
    resume,
    cancel,
    markStatus,
    reset,
  }
}
