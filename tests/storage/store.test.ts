import { describe, expect, it } from 'vitest'
import type { StorageArea } from '@/storage/area'
import { hashAccount } from '@/storage/hash'
import { MIGRATIONS, migrate } from '@/storage/migrate'
import { SCHEMA_VERSION, emptyScan } from '@/storage/schema'
import { QUOTA_BYTES, createScanStore, quotaStatus } from '@/storage/store'

function memoryArea(initial: Record<string, unknown> = {}): StorageArea & {
  data: Record<string, unknown>
} {
  const data: Record<string, unknown> = { ...initial }

  return {
    data,
    get: (keys) => {
      if (typeof keys !== 'string') return Promise.resolve({ ...data })
      return Promise.resolve(keys in data ? { [keys]: data[keys] } : {})
    },
    set: (items) => {
      Object.assign(data, items)
      return Promise.resolve()
    },
    remove: (keys) => {
      for (const key of Array.isArray(keys) ? keys : [keys]) delete data[key]
      return Promise.resolve()
    },
    getBytesInUse: () => Promise.resolve(JSON.stringify(data).length),
  }
}

describe('hashAccount', () => {
  it('is stable and case insensitive', async () => {
    expect(await hashAccount('A@B.fr')).toBe(await hashAccount(' a@b.fr '))
  })

  it('does not contain the address', async () => {
    const hash = await hashAccount('someone@example.com')
    expect(hash).toHaveLength(64)
    expect(hash).not.toContain('someone')
  })

  it('separates different accounts', async () => {
    expect(await hashAccount('a@x.fr')).not.toBe(await hashAccount('b@x.fr'))
  })
})

const reasonOf = (raw: unknown) => {
  const result = migrate(raw)
  return result.ok ? undefined : result.reason
}

describe('migrate', () => {
  it('accepts a current document', () => {
    const result = migrate(emptyScan('hash', 1))
    expect(result.ok).toBe(true)
  })

  it('reports absent rather than failing', () => {
    expect(migrate(undefined)).toEqual({ ok: false, reason: 'absent' })
    expect(migrate(null)).toEqual({ ok: false, reason: 'absent' })
  })

  it('rejects anything that is not a scan document', () => {
    expect(reasonOf('nonsense')).toBe('unreadable')
    expect(reasonOf({ schemaVersion: 1 })).toBe('unreadable')
    expect(reasonOf({ accountHash: 'h', senders: [] })).toBe('unreadable')
  })

  it('refuses a document written by a newer build', () => {
    expect(reasonOf({ ...emptyScan('hash', 1), schemaVersion: SCHEMA_VERSION + 1 })).toBe(
      'from-the-future',
    )
  })

  it('reports a missing upgrade path instead of guessing', () => {
    expect(reasonOf({ ...emptyScan('hash', 1), schemaVersion: 0 })).toBe('no-migration')
  })

  it('applies a registered migration and stamps the new version', () => {
    MIGRATIONS[0] = (document) => ({ ...document, migrated: true })
    try {
      const result = migrate({ ...emptyScan('hash', 1), schemaVersion: 0 })
      expect(result.ok).toBe(true)
      expect(result.ok && result.document.schemaVersion).toBe(SCHEMA_VERSION)
    } finally {
      delete MIGRATIONS[0]
    }
  })
})

describe('createScanStore', () => {
  it('round-trips a document', async () => {
    const store = createScanStore(memoryArea())
    const document = { ...emptyScan('hash-a', 100), processed: 7 }

    await store.save(document)
    const outcome = await store.load('hash-a')

    expect(outcome.status).toBe('loaded')
    expect(outcome.status === 'loaded' && outcome.document.processed).toBe(7)
  })

  it('is empty when nothing has been stored', async () => {
    expect((await createScanStore(memoryArea()).load('hash')).status).toBe('empty')
  })

  it('discards a scan belonging to another account', async () => {
    const store = createScanStore(memoryArea())
    await store.save(emptyScan('hash-a', 100))

    const outcome = await store.load('hash-b')
    expect(outcome.status).toBe('discarded')
    expect(outcome.status === 'discarded' && outcome.reason).toContain('different account')
  })

  it('clears the scan but leaves other keys alone', async () => {
    const area = memoryArea({ locale: 'fr' })
    const store = createScanStore(area)
    await store.save(emptyScan('hash', 1))

    await store.clearScan()

    expect(area.data.scan).toBeUndefined()
    expect(area.data.locale).toBe('fr')
  })

  it('wipes everything the extension owns, including the locale', async () => {
    const area = memoryArea({ locale: 'fr' })
    const store = createScanStore(area)
    await store.save(emptyScan('hash', 1))

    await store.wipeAll()

    expect(Object.keys(area.data)).toEqual([])
  })

  it('reports usage', async () => {
    const store = createScanStore(memoryArea({ scan: 'x' }))
    expect((await store.usage()).bytes).toBeGreaterThan(0)
  })
})

describe('quotaStatus', () => {
  it('warns only past four fifths of the quota', () => {
    expect(quotaStatus(QUOTA_BYTES * 0.79).warn).toBe(false)
    expect(quotaStatus(QUOTA_BYTES * 0.8).warn).toBe(true)
  })

  it('does not divide by zero', () => {
    expect(quotaStatus(10, 0).ratio).toBe(0)
  })
})
