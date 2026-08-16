import { useCallback, useRef, useState } from 'react'
import type { SenderAggregate } from '@/core/aggregate/senders'
import { createExecutor } from '@/core/unsubscribe/executor'
import { runUnsubscribeQueue } from '@/core/unsubscribe/queue'
import type { UnsubscribeResult } from '@/core/unsubscribe/queue'

export type RunPhase = 'idle' | 'running' | 'report'

async function openTab(url: string): Promise<void> {
  if (typeof chrome === 'undefined' || typeof chrome.tabs === 'undefined') return
  // Background tabs, so a bulk run does not yank focus away repeatedly.
  await chrome.tabs.create({ url, active: false })
}

export function useUnsubscribeRun() {
  const [phase, setPhase] = useState<RunPhase>('idle')
  const [progress, setProgress] = useState({ index: 0, total: 0 })
  const [results, setResults] = useState<UnsubscribeResult[]>([])
  const [cancelled, setCancelled] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  const run = useCallback(async (senders: readonly SenderAggregate[], hostAccess: boolean) => {
    const controller = new AbortController()
    abortRef.current = controller

    setPhase('running')
    setResults([])
    setCancelled(false)
    setProgress({ index: 0, total: senders.length })

    const executor = createExecutor({ hostAccess, openTab })

    for await (const event of runUnsubscribeQueue(senders, executor, {
      signal: controller.signal,
    })) {
      if (event.type === 'start') {
        setProgress({ index: event.index + 1, total: event.total })
      } else if (event.type === 'result') {
        setResults((previous) => [...previous, event.result])
      } else {
        setCancelled(event.cancelled)
        setPhase('report')
      }
    }

    abortRef.current = null
  }, [])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const dismiss = useCallback(() => {
    setPhase('idle')
    setResults([])
  }, [])

  return { phase, progress, results, cancelled, run, cancel, dismiss }
}
