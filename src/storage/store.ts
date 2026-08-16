import type { StorageArea } from './area'
import { STORAGE_KEYS } from './keys'
import { migrate } from './migrate'
import type { MigrationFailureReason } from './migrate'
import type { PersistedScan } from './schema'

/** chrome.storage.local without the unlimitedStorage permission. */
export const QUOTA_BYTES = 10 * 1024 * 1024

export const WARN_RATIO = 0.8

export type QuotaStatus = {
  bytes: number
  ratio: number
  warn: boolean
}

export type LoadOutcome =
  | { status: 'loaded'; document: PersistedScan }
  | { status: 'empty' }
  | { status: 'discarded'; reason: string }

export type ScanStore = {
  load(accountHash: string): Promise<LoadOutcome>
  save(document: PersistedScan): Promise<void>
  clearScan(): Promise<void>
  wipeAll(): Promise<void>
  usage(): Promise<QuotaStatus>
}

const DISCARD_REASONS: Record<MigrationFailureReason, string> = {
  absent: 'nothing stored',
  unreadable: 'stored data was not readable',
  'from-the-future': 'stored by a newer version of the extension',
  'no-migration': 'no upgrade path from the stored schema version',
}

export function quotaStatus(bytes: number, quota: number = QUOTA_BYTES): QuotaStatus {
  const ratio = quota <= 0 ? 0 : bytes / quota
  return { bytes, ratio, warn: ratio >= WARN_RATIO }
}

export function createScanStore(area: StorageArea): ScanStore {
  return {
    async load(accountHash) {
      const stored = await area.get(STORAGE_KEYS.scan)
      const result = migrate(stored[STORAGE_KEYS.scan])

      if (!result.ok) {
        if (result.reason === 'absent') return { status: 'empty' }
        return { status: 'discarded', reason: DISCARD_REASONS[result.reason] }
      }

      // A scan belongs to the account that produced it. Signing in as someone
      // else must not silently continue against the previous mailbox.
      if (result.document.accountHash !== accountHash) {
        return { status: 'discarded', reason: 'stored scan belongs to a different account' }
      }

      return { status: 'loaded', document: result.document }
    },

    async save(document) {
      await area.set({ [STORAGE_KEYS.scan]: document })
    },

    async clearScan() {
      await area.remove(STORAGE_KEYS.scan)
    },

    async wipeAll() {
      await area.remove(Object.values(STORAGE_KEYS))
    },

    async usage() {
      if (!area.getBytesInUse) return quotaStatus(0)
      return quotaStatus(await area.getBytesInUse(null))
    },
  }
}
