import { describe, expect, it, vi } from 'vitest'
import { AbortedError, mapWithConcurrency } from '@/core/async/pool'
import { backoffDelay, withRetry } from '@/core/async/retry'
import { GmailError } from '@/core/gmail/errors'

describe('mapWithConcurrency', () => {
  it('keeps results in input order regardless of completion order', async () => {
    const delays = [30, 0, 15, 5]
    const result = await mapWithConcurrency(delays, 4, async (delay, index) => {
      await new Promise((resolve) => setTimeout(resolve, delay))
      return index
    })

    expect(result).toEqual([0, 1, 2, 3])
  })

  it('never exceeds the requested concurrency', async () => {
    let inFlight = 0
    let peak = 0

    await mapWithConcurrency(
      Array.from({ length: 20 }, (_, i) => i),
      3,
      async () => {
        inFlight += 1
        peak = Math.max(peak, inFlight)
        await new Promise((resolve) => setTimeout(resolve, 1))
        inFlight -= 1
      },
    )

    expect(peak).toBeLessThanOrEqual(3)
  })

  it('handles an empty input', async () => {
    expect(await mapWithConcurrency([], 5, () => Promise.resolve(1))).toEqual([])
  })

  it('stops when the signal is aborted', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(
      mapWithConcurrency([1, 2, 3], 2, () => Promise.resolve(1), controller.signal),
    ).rejects.toBeInstanceOf(AbortedError)
  })
})

describe('backoffDelay', () => {
  it('grows exponentially and stays under the ceiling', () => {
    const noJitter = () => 1
    expect(backoffDelay(0, 500, 30_000, noJitter)).toBe(500)
    expect(backoffDelay(1, 500, 30_000, noJitter)).toBe(1000)
    expect(backoffDelay(2, 500, 30_000, noJitter)).toBe(2000)
    expect(backoffDelay(20, 500, 30_000, noJitter)).toBe(30_000)
  })

  it('jitters across the lower half of the window', () => {
    expect(backoffDelay(1, 500, 30_000, () => 0)).toBe(500)
    expect(backoffDelay(1, 500, 30_000, () => 1)).toBe(1000)
  })
})

describe('withRetry', () => {
  const options = { sleep: () => Promise.resolve(), random: () => 0.5, baseDelayMs: 1 }

  it('returns the first success without retrying', async () => {
    const operation = vi.fn().mockResolvedValue('ok')
    expect(await withRetry(operation, options)).toBe('ok')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('retries throttling and eventually succeeds', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new GmailError('rate-limit', 429, '', 'slow down'))
      .mockResolvedValue('ok')

    expect(await withRetry(operation, options)).toBe('ok')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('does not retry a scope denial', async () => {
    const operation = vi
      .fn()
      .mockRejectedValue(new GmailError('forbidden', 403, 'insufficientPermissions', 'nope'))

    await expect(withRetry(operation, options)).rejects.toThrow('nope')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('gives up after the attempt limit', async () => {
    const operation = vi.fn().mockRejectedValue(new GmailError('rate-limit', 429, '', 'busy'))

    await expect(withRetry(operation, { ...options, attempts: 3 })).rejects.toThrow('busy')
    expect(operation).toHaveBeenCalledTimes(3)
  })
})
