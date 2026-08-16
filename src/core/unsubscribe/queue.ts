import { realSleep } from '../async/pool'
import type { Sleep } from '../async/pool'
import type { SenderAggregate } from '../aggregate/senders'

export type UnsubscribeStatus = 'done' | 'needs-confirmation' | 'failed'

export type UnsubscribeOutcome = {
  status: UnsubscribeStatus
  detail: string
}

export type UnsubscribeResult = UnsubscribeOutcome & { key: string }

export type UnsubscribeExecutor = (sender: SenderAggregate) => Promise<UnsubscribeOutcome>

export type QueueEvent =
  | { type: 'start'; key: string; index: number; total: number }
  | { type: 'result'; result: UnsubscribeResult; index: number; total: number }
  | { type: 'finished'; results: UnsubscribeResult[]; cancelled: boolean }

export type QueueOptions = {
  /** Spacing between senders, so a bulk run does not look like an attack. */
  delayMs?: number
  sleep?: Sleep
  signal?: AbortSignal
}

export async function* runUnsubscribeQueue(
  senders: readonly SenderAggregate[],
  executor: UnsubscribeExecutor,
  options: QueueOptions = {},
): AsyncGenerator<QueueEvent> {
  const { delayMs = 500, sleep = realSleep, signal } = options
  const results: UnsubscribeResult[] = []

  for (const [index, sender] of senders.entries()) {
    if (signal?.aborted) {
      yield { type: 'finished', results, cancelled: true }
      return
    }

    yield { type: 'start', key: sender.key, index, total: senders.length }

    let outcome: UnsubscribeOutcome
    try {
      outcome = await executor(sender)
    } catch (error) {
      // One sender failing must never take the rest of the run down with it.
      outcome = {
        status: 'failed',
        detail: error instanceof Error ? error.message : 'Unexpected failure',
      }
    }

    const result: UnsubscribeResult = { key: sender.key, ...outcome }
    results.push(result)
    yield { type: 'result', result, index, total: senders.length }

    if (index < senders.length - 1) await sleep(delayMs)
  }

  yield { type: 'finished', results, cancelled: false }
}

export function summarise(
  results: readonly UnsubscribeResult[],
): Record<UnsubscribeStatus, number> {
  const summary: Record<UnsubscribeStatus, number> = {
    done: 0,
    'needs-confirmation': 0,
    failed: 0,
  }

  for (const result of results) summary[result.status] += 1
  return summary
}
