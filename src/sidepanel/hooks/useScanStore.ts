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

      // A discarded document is not worth reporting: it belonged to another
      // account or another build, and the panel simply starts fresh.
      if (outcome.status === 'loaded') setRestored(outcome.document)

      setUsage(await store.usage())
      setReady(true)
    }

    restore().catch((error: unknown) => {
      console.error('Could not read stored data', error)
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
    if (accountHash === '') return
    await store.clearScan(accountHash)
    setRestored(null)
    setUsage(await store.usage())
  }, [accountHash, store])

  return { ready, accountHash, restored, usage, save, clear }
}
