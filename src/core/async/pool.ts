export type Sleep = (ms: number) => Promise<void>

export const realSleep: Sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export class AbortedError extends Error {
  constructor() {
    super('Operation aborted')
    this.name = 'AbortedError'
  }
}

/**
 * Runs `worker` over `items` with at most `concurrency` in flight, preserving
 * input order in the result. Workers pull from a shared cursor rather than
 * being handed fixed slices, so one slow request cannot stall a whole batch.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  signal?: AbortSignal,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  const width = Math.max(1, Math.min(concurrency, items.length))
  let cursor = 0

  async function run(): Promise<void> {
    for (;;) {
      if (signal?.aborted) throw new AbortedError()

      const index = cursor
      cursor += 1
      if (index >= items.length) return

      const item = items[index]
      if (item === undefined) return

      results[index] = await worker(item, index)
    }
  }

  await Promise.all(Array.from({ length: width }, () => run()))
  return results
}
