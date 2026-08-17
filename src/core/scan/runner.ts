import { AbortedError } from '../async/pool'
import type { GmailFetch } from '../gmail/client'
import { SCAN_LABELS, fetchMetadata, listMessagePage } from '../gmail/collect'
import type { GmailMessageMetadata } from '../gmail/types'

export const DAY_MS = 24 * 60 * 60 * 1000

/**
 * How many consecutive pages must fall entirely outside the window before a
 * category is abandoned.
 *
 * Stopping on the first one is too eager. The ordering check can only notice a
 * problem once a later page holds something newer than an earlier page, so a
 * mailbox that returns pages out of order can be cut short on page one, before
 * anything has had a chance to detect it — quietly under-reporting senders with
 * a result that still looks complete. Requiring a run of them costs a couple of
 * extra pages on a well-ordered mailbox and makes that failure far less likely.
 */
export const PAGES_OUTSIDE_BEFORE_STOP = 3

export type ScanOptions = {
  labels?: readonly string[]
  windowDays?: number
  concurrency?: number
  batchSize?: number
  /** Safety net. Bounds the scan if Gmail ever stops returning newest-first. */
  maxMessages?: number
  now?: () => number
  signal?: AbortSignal
}

export type ScanCheckpoint = {
  labelIndex: number
  pageToken?: string
  processed: number
}

export type StopReason = 'complete' | 'cap-reached'

export type ScanEvent =
  | { type: 'batch'; label: string; messages: GmailMessageMetadata[]; checkpoint: ScanCheckpoint }
  | { type: 'label-done'; label: string; reason: 'exhausted' | 'outside-window' }
  | { type: 'warning'; code: 'out-of-order'; label: string; detail: string }
  | { type: 'done'; processed: number; reason: StopReason }

const REQUIRED: Required<Omit<ScanOptions, 'signal'>> = {
  labels: SCAN_LABELS,
  windowDays: 365,
  // Measured (spike S-2): throughput scales linearly to 20 with no throttling,
  // and 40 loses a fifth of its requests to 429s. See docs/architecture.md.
  concurrency: 20,
  batchSize: 100,
  maxMessages: 25_000,
  now: Date.now,
}

function dateOf(message: GmailMessageMetadata): number {
  const value = Number(message.internalDate)
  return Number.isFinite(value) ? value : 0
}

/**
 * Walks each category newest-first and stops once messages fall outside the
 * window.
 *
 * The window cannot be applied as a filter: messages.list returns identifiers
 * only, and a message's date is unknown until messages.get, so discarding
 * afterwards would save nothing. Stopping early is what makes the window worth
 * having. That depends on Gmail returning newest-first, which is observed
 * rather than documented, so ordering is checked as it goes and a hard cap
 * bounds the damage if it ever changes.
 */
export async function* runScan(
  gmailFetch: GmailFetch,
  options: ScanOptions = {},
  resume?: ScanCheckpoint,
): AsyncGenerator<ScanEvent> {
  const { labels, windowDays, concurrency, batchSize, maxMessages, now } = {
    ...REQUIRED,
    ...options,
  }
  const signal = options.signal
  const cutoff = now() - windowDays * DAY_MS

  let processed = resume?.processed ?? 0
  let labelIndex = resume?.labelIndex ?? 0
  let pageToken = resume?.pageToken

  for (; labelIndex < labels.length; labelIndex += 1) {
    const label = labels[labelIndex]
    if (label === undefined) continue

    let warnedOutOfOrder = false
    let previousOldest = Number.POSITIVE_INFINITY
    let pagesOutside = 0

    for (;;) {
      if (signal?.aborted) throw new AbortedError()

      if (processed >= maxMessages) {
        yield { type: 'done', processed, reason: 'cap-reached' }
        return
      }

      const page = await listMessagePage(gmailFetch, {
        labelId: label,
        maxResults: Math.min(batchSize, maxMessages - processed),
        ...(pageToken === undefined ? {} : { pageToken }),
        ...(signal ? { signal } : {}),
      })

      if (page.refs.length === 0) {
        yield { type: 'label-done', label, reason: 'exhausted' }
        break
      }

      const messages = await fetchMetadata(
        gmailFetch,
        page.refs.map((ref) => ref.id),
        { concurrency, ...(signal ? { signal } : {}) },
      )

      processed += messages.length

      const dates = messages.map(dateOf).filter((date) => date > 0)
      const newest = dates.length > 0 ? Math.max(...dates) : 0
      const oldest = dates.length > 0 ? Math.min(...dates) : 0

      if (!warnedOutOfOrder && newest > previousOldest) {
        warnedOutOfOrder = true
        yield {
          type: 'warning',
          code: 'out-of-order',
          label,
          detail:
            'A later page contained a message newer than the previous page. Newest-first ordering does not hold, so the window cannot be trusted to stop the scan early.',
        }
      }
      previousOldest = oldest > 0 ? oldest : previousOldest

      const inWindow = messages.filter((message) => dateOf(message) >= cutoff)
      pageToken = page.nextPageToken

      const checkpoint: ScanCheckpoint = {
        labelIndex,
        processed,
        ...(pageToken === undefined ? {} : { pageToken }),
      }

      if (inWindow.length > 0) {
        yield { type: 'batch', label, messages: inWindow, checkpoint }
      }

      // A run of pages entirely older than the cutoff means the rest are too,
      // assuming the ordering warning has not fired. A single such page is not
      // enough: see PAGES_OUTSIDE_BEFORE_STOP.
      pagesOutside = newest > 0 && newest < cutoff ? pagesOutside + 1 : 0

      if (pagesOutside >= PAGES_OUTSIDE_BEFORE_STOP && !warnedOutOfOrder) {
        yield { type: 'label-done', label, reason: 'outside-window' }
        break
      }

      if (pageToken === undefined) {
        yield { type: 'label-done', label, reason: 'exhausted' }
        break
      }
    }

    pageToken = undefined
  }

  yield { type: 'done', processed, reason: 'complete' }
}
