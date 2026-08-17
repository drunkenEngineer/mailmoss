import { withRetry } from '../async/retry'
import type { GmailFetch } from './client'
import type { GmailHistoryList } from './types'

export type HistoryDelta = {
  /** Ids of messages added since the starting point, deduplicated. */
  messageIds: string[]
  historyId: string
}

/** History ids are numeric strings that outgrow Number, so they compare as BigInt. */
export function maxHistoryId(a: string, b: string): string {
  if (a === '') return b
  if (b === '') return a
  try {
    return BigInt(a) >= BigInt(b) ? a : b
  } catch {
    return b
  }
}

export async function listHistory(
  gmailFetch: GmailFetch,
  options: { startHistoryId: string; labelId?: string; signal?: AbortSignal },
): Promise<HistoryDelta> {
  const seen = new Set<string>()
  let pageToken: string | undefined
  let historyId = ''

  do {
    const page = await withRetry(() =>
      gmailFetch<GmailHistoryList>({
        path: '/users/me/history',
        params: {
          startHistoryId: options.startHistoryId,
          historyTypes: 'messageAdded',
          labelId: options.labelId,
          maxResults: 500,
          pageToken,
        },
        ...(options.signal ? { signal: options.signal } : {}),
      }),
    )

    historyId = maxHistoryId(historyId, page.historyId)

    for (const record of page.history ?? []) {
      // A message can appear in several records; only its id matters here.
      for (const added of record.messagesAdded ?? []) seen.add(added.message.id)
    }

    pageToken = page.nextPageToken
  } while (pageToken !== undefined)

  return { messageIds: [...seen], historyId }
}
