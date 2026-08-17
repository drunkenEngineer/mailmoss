import type { StorageArea } from './area'
import { STORAGE_KEYS, isScanKey, scanKey } from './keys'
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
  clearScan(accountHash: string): Promise<void>
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
  /**
   * Moves a scan written under the old single slot to its account's own key.
   * Only the account that produced it can claim it; anyone else leaves it be,
   * so the rightful owner can still recover it by connecting.
   */
  async function claimLegacy(accountHash: string): Promise<unknown> {
    const stored = await area.get(STORAGE_KEYS.legacyScan)
    const raw = stored[STORAGE_KEYS.legacyScan]
    if (raw === undefined) return undefined

    const result = migrate(raw)
    if (!result.ok || result.document.accountHash !== accountHash) return undefined

    await area.set({ [scanKey(accountHash)]: result.document })
    await area.remove(STORAGE_KEYS.legacyScan)
    return result.document
  }

  return {
    async load(accountHash) {
      const key = scanKey(accountHash)
      const stored = await area.get(key)
      const raw = stored[key] ?? (await claimLegacy(accountHash))

      const result = migrate(raw)

      if (!result.ok) {
        if (result.reason === 'absent') return { status: 'empty' }
        return { status: 'discarded', reason: DISCARD_REASONS[result.reason] }
      }

      // Belt and braces: the key already pins the account, but a mismatched
      // document would mean something wrote to the wrong slot.
      if (result.document.accountHash !== accountHash) {
        return { status: 'discarded', reason: 'stored scan belongs to a different account' }
      }

      return { status: 'loaded', document: result.document }
    },

    async save(document) {
      await area.set({ [scanKey(document.accountHash)]: document })
    },

    async clearScan(accountHash) {
      await area.remove(scanKey(accountHash))
    },

    async wipeAll() {
      // Everything the extension owns, including scans for every account.
      const all = await area.get(null)
      const keys = Object.keys(all).filter(
        (key) =>
          isScanKey(key) ||
          key === STORAGE_KEYS.legacyScan ||
          key === STORAGE_KEYS.locale ||
          key === STORAGE_KEYS.theme,
      )
      if (keys.length > 0) await area.remove(keys)
    },

    async usage() {
      if (!area.getBytesInUse) return quotaStatus(0)
      return quotaStatus(await area.getBytesInUse(null))
    },
  }
}
