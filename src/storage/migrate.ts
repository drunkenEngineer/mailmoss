import { SCHEMA_VERSION } from './schema'
import type { PersistedScan } from './schema'

export type MigrationFailureReason = 'absent' | 'unreadable' | 'from-the-future' | 'no-migration'

export type MigrationResult =
  { ok: true; document: PersistedScan } | { ok: false; reason: MigrationFailureReason }

type RawDocument = Record<string, unknown>

/** Keyed by the version being migrated *from*. */
export const MIGRATIONS: Record<number, (document: RawDocument) => RawDocument> = {
  // 1 -> 2: senders gained a status, so an existing scan survives the upgrade
  // instead of being thrown away and rerun.
  1: (document) => ({
    ...document,
    senders: (document.senders as Record<string, unknown>[]).map((sender) => ({
      ...sender,
      status: sender.status ?? 'pending',
    })),
  }),
}

function looksLikeScan(value: RawDocument): boolean {
  return typeof value.accountHash === 'string' && Array.isArray(value.senders)
}

export function migrate(raw: unknown): MigrationResult {
  if (raw === undefined || raw === null) return { ok: false, reason: 'absent' }
  if (typeof raw !== 'object') return { ok: false, reason: 'unreadable' }

  let document = { ...(raw as RawDocument) }
  const version = document.schemaVersion

  if (typeof version !== 'number' || !looksLikeScan(document)) {
    return { ok: false, reason: 'unreadable' }
  }

  // A document written by a newer build cannot be understood by an older one.
  // Discarding and rescanning is cheap; guessing at unknown fields is not.
  if (version > SCHEMA_VERSION) return { ok: false, reason: 'from-the-future' }

  let current = version
  while (current < SCHEMA_VERSION) {
    const step = MIGRATIONS[current]
    if (!step) return { ok: false, reason: 'no-migration' }
    document = step(document)
    current += 1
    document.schemaVersion = current
  }

  return { ok: true, document: document as unknown as PersistedScan }
}
