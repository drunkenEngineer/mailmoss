import { useCallback, useRef, useState } from 'react'
import { aggregate } from '@/core/aggregate/senders'
import type { SenderAggregate, SenderStatus } from '@/core/aggregate/senders'
import { createGmailFetch } from '@/core/gmail/client'
import { GmailError } from '@/core/gmail/errors'
import { currentHistoryId, refreshSince } from '@/core/scan/refresh'
import { runScan } from '@/core/scan/runner'
import type { ScanCheckpoint } from '@/core/scan/runner'
import { SCHEMA_VERSION } from '@/storage/schema'
import type { useScanStore } from './useScanStore'

export type ScanPhase = 'idle' | 'scanning' | 'refreshing' | 'done' | 'cancelled' | 'error'

export type RefreshNotice =
  { kind: 'updated'; count: number } | { kind: 'up-to-date' } | { kind: 'too-old' }

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
  const [historyId, setHistoryId] = useState(restored?.lastHistoryId ?? '')
  const [notice, setNotice] = useState<RefreshNotice | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  // `processed` is passed rather than read off the checkpoint, because the
  // checkpoint is cleared precisely when a scan finishes. Deriving it there
  // saved a completed scan as having examined nothing.
  const persist = useCallback(
    async (options: {
      rows: SenderAggregate[]
      checkpoint: ScanCheckpoint | undefined
      startedAt: number
      processed: number
      lastHistoryId?: string
    }) => {
      const marker = options.lastHistoryId ?? historyId
      await save({
        schemaVersion: SCHEMA_VERSION,
        accountHash,
        startedAt: options.startedAt,
        processed: options.processed,
        senders: options.rows,
        ...(marker === '' ? {} : { lastHistoryId: marker }),
        ...(options.checkpoint ? { checkpoint: options.checkpoint } : { completedAt: Date.now() }),
      })
    },
    [accountHash, historyId, save],
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
      let examined = options.resume ? (checkpoint?.processed ?? 0) : 0

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
            examined = event.checkpoint.processed
            batches += 1

            const snapshot = [...rows.values()]
            setSenders(snapshot)
            setCheckpoint(event.checkpoint)
            setProcessed(examined)
            setLabel(event.label)
            setRate((examined / Math.max(1, Date.now() - startedAt)) * 1000)

            if (batches % SAVE_EVERY === 0) {
              await persist({ rows: snapshot, checkpoint: live, startedAt, processed: examined })
            }
          } else if (event.type === 'warning') {
            setOutOfOrder(true)
          } else if (event.type === 'done') {
            live = undefined
            examined = event.processed
            setCheckpoint(undefined)
            setProcessed(examined)
            setPhase('done')

            // Read after the scan, not before. Taking it first would make the
            // next refresh re-deliver messages the scan already counted, and
            // with no stored message ids there is nothing to deduplicate
            // against. Missing the handful that arrived mid-scan cannot move a
            // ranking built on hundreds.
            const marker = await currentHistoryId(createGmailFetch(token)).catch(() => '')
            if (marker !== '') setHistoryId(marker)

            await persist({
              rows: [...rows.values()],
              checkpoint: undefined,
              startedAt,
              processed: examined,
              lastHistoryId: marker,
            })
          }
        }
      } catch (error) {
        const aborted =
          controller.signal.aborted ||
          (error instanceof Error && error.message.toLowerCase().includes('abort'))

        if (aborted) {
          setPhase('cancelled')
          await persist({
            rows: [...rows.values()],
            checkpoint: live,
            startedAt,
            processed: examined,
          })
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
      // Marking senders handled must not rewrite what the scan found.
      await persist({ rows: next, checkpoint, startedAt: Date.now(), processed })
    },
    [checkpoint, persist, processed, senders],
  )

  const refresh = useCallback(async () => {
    if (historyId === '') return

    setPhase('refreshing')
    setNotice(null)

    try {
      const result = await refreshSince(createGmailFetch(token), historyId)

      if (result.status === 'too-old') {
        setNotice({ kind: 'too-old' })
        setPhase('done')
        return
      }

      if (result.status === 'up-to-date') {
        setHistoryId(result.historyId)
        setNotice({ kind: 'up-to-date' })
        setPhase('done')
        return
      }

      const rows = new Map(senders.map((sender) => [sender.key, sender]))
      aggregate(result.messages, rows)
      const next = [...rows.values()]

      setSenders(next)
      setHistoryId(result.historyId)
      setProcessed(processed + result.messages.length)
      setNotice({ kind: 'updated', count: result.messages.length })
      setPhase('done')

      await persist({
        rows: next,
        checkpoint: undefined,
        startedAt: Date.now(),
        processed: processed + result.messages.length,
        lastHistoryId: result.historyId,
      })
    } catch (error) {
      setFailure(failureOf(error))
      setPhase('error')
    }
  }, [historyId, persist, processed, senders, token])

  const reset = useCallback(async () => {
    setSenders([])
    setProcessed(0)
    setCheckpoint(undefined)
    setHistoryId('')
    setNotice(null)
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
    notice,
    canResume: checkpoint !== undefined,
    canRefresh: historyId !== '' && checkpoint === undefined,
    start,
    resume,
    refresh,
    cancel,
    markStatus,
    reset,
  }
}
