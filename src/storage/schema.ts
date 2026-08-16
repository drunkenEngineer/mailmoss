import type { SenderAggregate } from '../core/aggregate/senders'
import type { ScanCheckpoint } from '../core/scan/runner'

export const SCHEMA_VERSION = 2

/**
 * What is allowed to reach disk. Subjects, bodies and individual message
 * identifiers are absent by design, not by omission: chrome.storage.local is
 * not encrypted, so the less that lands there the smaller the exposure.
 */
export type PersistedScan = {
  schemaVersion: number
  /** SHA-256 of the address. The address itself is never stored. */
  accountHash: string
  startedAt: number
  completedAt?: number
  processed: number
  checkpoint?: ScanCheckpoint
  lastHistoryId?: string
  senders: SenderAggregate[]
}

export function emptyScan(accountHash: string, startedAt: number): PersistedScan {
  return {
    schemaVersion: SCHEMA_VERSION,
    accountHash,
    startedAt,
    processed: 0,
    senders: [],
  }
}
