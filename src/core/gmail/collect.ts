import { mapWithConcurrency } from '../async/pool'
import { withRetry } from '../async/retry'
import type { GmailFetch } from './client'
import type { GmailMessageList, GmailMessageMetadata, GmailMessageRef } from './types'

export const SCAN_LABELS = ['CATEGORY_PROMOTIONS', 'CATEGORY_UPDATES', 'CATEGORY_FORUMS'] as const

export const SCAN_HEADERS = ['From', 'Date', 'List-Unsubscribe', 'List-Unsubscribe-Post', 'List-Id']

/**
 * `labelIds` is an AND filter, so each category has to be listed separately.
 * Passing all three at once would match only messages carrying all three,
 * which is essentially none. See docs/architecture.md, spike S-1.
 */
export async function listMessageIds(
  gmailFetch: GmailFetch,
  options: { labelId: string; limit: number; signal?: AbortSignal },
): Promise<GmailMessageRef[]> {
  const collected: GmailMessageRef[] = []
  let pageToken: string | undefined

  while (collected.length < options.limit) {
    const page = await withRetry(() =>
      gmailFetch<GmailMessageList>({
        path: '/users/me/messages',
        params: {
          labelIds: options.labelId,
          maxResults: Math.min(500, options.limit - collected.length),
          pageToken,
        },
        ...(options.signal ? { signal: options.signal } : {}),
      }),
    )

    collected.push(...(page.messages ?? []))

    pageToken = page.nextPageToken
    if (pageToken === undefined) break
  }

  return collected.slice(0, options.limit)
}

export async function fetchMetadata(
  gmailFetch: GmailFetch,
  ids: readonly string[],
  options: { concurrency: number; signal?: AbortSignal },
): Promise<GmailMessageMetadata[]> {
  return mapWithConcurrency(
    ids,
    options.concurrency,
    (id) =>
      withRetry(() =>
        gmailFetch<GmailMessageMetadata>({
          path: `/users/me/messages/${id}`,
          params: { format: 'metadata', metadataHeaders: SCAN_HEADERS },
          ...(options.signal ? { signal: options.signal } : {}),
        }),
      ),
    options.signal,
  )
}

export function headerValue(message: GmailMessageMetadata, name: string): string | undefined {
  const wanted = name.toLowerCase()
  return message.payload?.headers?.find((header) => header.name.toLowerCase() === wanted)?.value
}
