import { useCallback, useEffect, useMemo, useState } from 'react'
import { chromeLocalArea, hasStorage } from '@/storage/area'
import { hashAccount } from '@/storage/hash'
import type { LoadOutcome, QuotaStatus } from '@/storage/store'
import { createScanStore, quotaStatus } from '@/storage/store'
import type { PersistedScan } from '@/storage/schema'

const noopArea = {
  get: () => Promise.resolve({}),
  set: () => Promise.resolve(),
  remove: () => Promise.resolve(),
}

export function useScanStore(email: string) {
  const store = useMemo(() => createScanStore(hasStorage() ? chromeLocalArea() : noopArea), [])

  const [accountHash, setAccountHash] = useState('')
  const [restored, setRestored] = useState<PersistedScan | null>(null)
  const [note, setNote] = useState('')
  const [usage, setUsage] = useState<QuotaStatus>(quotaStatus(0))
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    async function restore() {
      const hash = await hashAccount(email)
      if (!active) return
      setAccountHash(hash)

      const outcome: LoadOutcome = await store.load(hash)
      if (!active) return

      if (outcome.status === 'loaded') {
        setRestored(outcome.document)
        setNote(`Restored ${String(outcome.document.senders.length)} senders from a saved scan.`)
      } else if (outcome.status === 'discarded') {
        setNote(`Saved scan discarded: ${outcome.reason}.`)
      }

      setUsage(await store.usage())
      setReady(true)
    }

    restore().catch((error: unknown) => {
      setNote(error instanceof Error ? error.message : 'Could not read stored data')
      setReady(true)
    })

    return () => {
      active = false
    }
  }, [email, store])

  const save = useCallback(
    async (document: PersistedScan) => {
      await store.save(document)
      setUsage(await store.usage())
    },
    [store],
  )

  const clear = useCallback(async () => {
    await store.clearScan()
    setRestored(null)
    setNote('Cleared.')
    setUsage(await store.usage())
  }, [store])

  return { ready, accountHash, restored, note, usage, save, clear }
}
