import { GmailError, isRetryable } from '../gmail/errors'
import { realSleep } from './pool'
import type { Sleep } from './pool'

export type RetryOptions = {
  attempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  sleep?: Sleep
  random?: () => number
}

export function backoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  random: () => number,
): number {
  const exponential = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs)
  // Jitter across the lower half keeps a burst of retries from resynchronising
  // into another burst against the same rate limit.
  return Math.round(exponential * (0.5 + random() * 0.5))
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    attempts = 5,
    baseDelayMs = 500,
    maxDelayMs = 30_000,
    sleep = realSleep,
    random = Math.random,
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation(attempt)
    } catch (error) {
      lastError = error

      const retryable = error instanceof GmailError && isRetryable(error)
      if (!retryable || attempt === attempts - 1) throw error

      await sleep(backoffDelay(attempt, baseDelayMs, maxDelayMs, random))
    }
  }

  throw lastError
}
