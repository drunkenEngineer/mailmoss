import { mapWithConcurrency } from '../async/pool'
import type { GmailFetch } from './client'
import { GmailError } from './errors'
import { SCAN_HEADERS } from './collect'
import type { GmailMessageMetadata } from './types'

export const CONCURRENCY_LEVELS = [5, 10, 20, 40] as const

export type ThroughputSample = {
  concurrency: number
  requested: number
  succeeded: number
  rateLimited: number
  otherErrors: number
  elapsedMs: number
  perSecond: number
}

/**
 * Deliberately runs without retry or backoff. The point is to find where the
 * API starts pushing back, and retrying would paper over exactly that signal.
 */
async function timeLevel(
  gmailFetch: GmailFetch,
  ids: readonly string[],
  concurrency: number,
): Promise<ThroughputSample> {
  let succeeded = 0
  let rateLimited = 0
  let otherErrors = 0

  const started = Date.now()

  await mapWithConcurrency(ids, concurrency, async (id) => {
    try {
      await gmailFetch<GmailMessageMetadata>({
        path: `/users/me/messages/${id}`,
        params: { format: 'metadata', metadataHeaders: SCAN_HEADERS },
      })
      succeeded += 1
    } catch (error) {
      if (error instanceof GmailError && error.kind === 'rate-limit') rateLimited += 1
      else otherErrors += 1
    }
  })

  const elapsedMs = Math.max(1, Date.now() - started)

  return {
    concurrency,
    requested: ids.length,
    succeeded,
    rateLimited,
    otherErrors,
    elapsedMs,
    perSecond: Number(((succeeded / elapsedMs) * 1000).toFixed(1)),
  }
}

export function splitForLevels(ids: readonly string[], levels: readonly number[]): string[][] {
  const perLevel = Math.floor(ids.length / Math.max(1, levels.length))
  return levels.map((_level, index) => ids.slice(index * perLevel, (index + 1) * perLevel))
}

export async function probeThroughput(
  gmailFetch: GmailFetch,
  ids: readonly string[],
  levels: readonly number[] = CONCURRENCY_LEVELS,
): Promise<ThroughputSample[]> {
  const batches = splitForLevels(ids, levels)
  const samples: ThroughputSample[] = []

  for (const [index, level] of levels.entries()) {
    const batch = batches[index] ?? []
    if (batch.length === 0) continue
    samples.push(await timeLevel(gmailFetch, batch, level))
  }

  return samples
}

export function recommendConcurrency(samples: readonly ThroughputSample[]): {
  concurrency: number
  note: string
} {
  const clean = samples.filter((sample) => sample.rateLimited === 0)

  if (clean.length === 0) {
    return {
      concurrency: Math.min(...samples.map((sample) => sample.concurrency)),
      note: 'Every level was throttled. Drop below the lowest level tested and re-run.',
    }
  }

  const best = clean.reduce((a, b) => (b.perSecond > a.perSecond ? b : a))
  const throttled = samples.filter((sample) => sample.rateLimited > 0)

  return {
    concurrency: best.concurrency,
    note:
      throttled.length > 0
        ? `Fastest level with no throttling. Throttling began at ${String(Math.min(...throttled.map((s) => s.concurrency)))}.`
        : 'No level was throttled, so the ceiling is above what was tested.',
  }
}
