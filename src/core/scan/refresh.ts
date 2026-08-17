import type { GmailFetch } from '../gmail/client'
import { SCAN_LABELS, fetchMetadata } from '../gmail/collect'
import { GmailError } from '../gmail/errors'
import { listHistory, maxHistoryId } from '../gmail/history'
import type { GmailMessageMetadata, GmailProfile } from '../gmail/types'

export type RefreshResult =
  | { status: 'updated'; messages: GmailMessageMetadata[]; historyId: string }
  | { status: 'up-to-date'; historyId: string }
  /** Gmail keeps history for about a week; past that only a full scan can catch up. */
  | { status: 'too-old' }

export type RefreshOptions = {
  labels?: readonly string[]
  concurrency?: number
  signal?: AbortSignal
}

export async function currentHistoryId(gmailFetch: GmailFetch): Promise<string> {
  const profile = await gmailFetch<GmailProfile>({ path: '/users/me/profile' })
  return profile.historyId
}

/**
 * Pulls only what arrived since the last scan. One call per category, matching
 * how the scan itself walks labels, so personal mail is never fetched.
 */
export async function refreshSince(
  gmailFetch: GmailFetch,
  startHistoryId: string,
  options: RefreshOptions = {},
): Promise<RefreshResult> {
  const { labels = SCAN_LABELS, concurrency = 20, signal } = options
  const ids = new Set<string>()
  let historyId = startHistoryId

  for (const labelId of labels) {
    try {
      const delta = await listHistory(gmailFetch, {
        startHistoryId,
        labelId,
        ...(signal ? { signal } : {}),
      })

      for (const id of delta.messageIds) ids.add(id)
      historyId = maxHistoryId(historyId, delta.historyId)
    } catch (error) {
      // A history id older than Gmail's retention window comes back as 404.
      if (error instanceof GmailError && error.kind === 'not-found') return { status: 'too-old' }
      throw error
    }
  }

  if (ids.size === 0) return { status: 'up-to-date', historyId }

  const messages = await fetchMetadata(gmailFetch, [...ids], {
    concurrency,
    ...(signal ? { signal } : {}),
  })

  return { status: 'updated', messages, historyId }
}
