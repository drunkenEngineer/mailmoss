import { describe, expect, it } from 'vitest'
import { AbortedError } from '@/core/async/pool'
import type { GmailFetch, GmailRequest } from '@/core/gmail/client'
import { DAY_MS, runScan } from '@/core/scan/runner'
import type { ScanCheckpoint, ScanEvent } from '@/core/scan/runner'

const NOW = 1_800_000_000_000
const now = () => NOW

type FakeMessage = { id: string; date: number }

/**
 * Serves paginated ids per label and metadata per id, so the runner is
 * exercised end to end without touching the network.
 */
function fakeGmail(pages: Record<string, FakeMessage[][]>): GmailFetch {
  const byId = new Map<string, FakeMessage>()
  for (const label of Object.values(pages)) {
    for (const page of label) for (const message of page) byId.set(message.id, message)
  }

  return <T>(request: GmailRequest): Promise<T> => {
    if (request.path.startsWith('/users/me/messages/')) {
      const id = request.path.split('/').pop() ?? ''
      const found = byId.get(id)
      return Promise.resolve({
        id,
        threadId: id,
        labelIds: ['INBOX'],
        internalDate: String(found?.date ?? 0),
        payload: { headers: [{ name: 'From', value: `${id}@x.fr` }] },
      } as T)
    }

    const label = String(request.params?.labelIds ?? '')
    const index = Number(request.params?.pageToken ?? 0)
    const labelPages = pages[label] ?? []
    const page = labelPages[index] ?? []

    return Promise.resolve({
      messages: page.map((message) => ({ id: message.id, threadId: message.id })),
      resultSizeEstimate: page.length,
      ...(index + 1 < labelPages.length ? { nextPageToken: String(index + 1) } : {}),
    } as T)
  }
}

async function collect(generator: AsyncGenerator<ScanEvent>): Promise<ScanEvent[]> {
  const events: ScanEvent[] = []
  for await (const event of generator) events.push(event)
  return events
}

const recent = (id: string, daysAgo: number): FakeMessage => ({
  id,
  date: NOW - daysAgo * DAY_MS,
})

describe('runScan', () => {
  const options = { labels: ['L1'], batchSize: 2, concurrency: 2, windowDays: 365, now }

  it('emits batches and completes when a label runs out', async () => {
    const gmail = fakeGmail({ L1: [[recent('a', 1), recent('b', 2)], [recent('c', 3)]] })
    const events = await collect(runScan(gmail, options))

    const batches = events.filter((event) => event.type === 'batch')
    expect(batches.flatMap((batch) => batch.messages.map((m) => m.id))).toEqual(['a', 'b', 'c'])
    expect(events.at(-1)).toEqual({ type: 'done', processed: 3, reason: 'complete' })
  })

  it('stops a label after a run of pages falls outside the window', async () => {
    const gmail = fakeGmail({
      L1: [
        [recent('a', 1)],
        [recent('old1', 400)],
        [recent('old2', 500)],
        [recent('old3', 600)],
        [recent('never-read', 700)],
      ],
    })
    const events = await collect(runScan(gmail, options))

    expect(events).toContainEqual({ type: 'label-done', label: 'L1', reason: 'outside-window' })
    // Only the in-window message is emitted, and the fifth page is never fetched.
    expect(events.filter((e) => e.type === 'batch').flatMap((b) => b.messages)).toHaveLength(1)
    expect(events.at(-1)).toEqual({ type: 'done', processed: 4, reason: 'complete' })
  })

  it('does not stop on a single old page, which would truncate an unordered mailbox', async () => {
    // An old page early on, then recent mail again: stopping at the first would
    // have lost everything after it.
    const gmail = fakeGmail({
      L1: [[recent('a', 1)], [recent('old', 400)], [recent('b', 2)], [recent('c', 3)]],
    })
    const events = await collect(runScan(gmail, options))

    const ids = events.filter((e) => e.type === 'batch').flatMap((b) => b.messages.map((m) => m.id))
    expect(ids).toEqual(['a', 'b', 'c'])
  })

  it('drops out-of-window messages from a mixed page', async () => {
    const gmail = fakeGmail({ L1: [[recent('a', 1), recent('old', 400)]] })
    const events = await collect(runScan(gmail, options))

    const ids = events.filter((e) => e.type === 'batch').flatMap((b) => b.messages.map((m) => m.id))
    expect(ids).toEqual(['a'])
  })

  it('warns and keeps going when ordering is not newest-first', async () => {
    const gmail = fakeGmail({ L1: [[recent('old', 300)], [recent('new', 1)]] })
    const events = await collect(runScan(gmail, options))

    const warning = events.find((event) => event.type === 'warning')
    expect(warning?.code).toBe('out-of-order')
  })

  it('honours the hard cap', async () => {
    const gmail = fakeGmail({
      L1: [
        [recent('a', 1), recent('b', 1)],
        [recent('c', 1), recent('d', 1)],
      ],
    })
    const events = await collect(runScan(gmail, { ...options, maxMessages: 2 }))

    expect(events.at(-1)).toEqual({ type: 'done', processed: 2, reason: 'cap-reached' })
  })

  it('walks each label separately, since labelIds is an AND filter', async () => {
    const gmail = fakeGmail({ L1: [[recent('a', 1)]], L2: [[recent('b', 1)]] })
    const events = await collect(runScan(gmail, { ...options, labels: ['L1', 'L2'] }))

    expect(events.filter((e) => e.type === 'batch').map((b) => b.label)).toEqual(['L1', 'L2'])
  })

  it('resumes from a checkpoint without refetching earlier pages', async () => {
    const gmail = fakeGmail({ L1: [[recent('a', 1)], [recent('b', 2)]] })
    const resume: ScanCheckpoint = { labelIndex: 0, pageToken: '1', processed: 1 }
    const events = await collect(runScan(gmail, options, resume))

    const ids = events.filter((e) => e.type === 'batch').flatMap((b) => b.messages.map((m) => m.id))
    expect(ids).toEqual(['b'])
    expect(events.at(-1)).toEqual({ type: 'done', processed: 2, reason: 'complete' })
  })

  it('hands back a checkpoint that can restart the next page', async () => {
    const gmail = fakeGmail({ L1: [[recent('a', 1)], [recent('b', 2)]] })
    const events = await collect(runScan(gmail, options))
    const first = events.find((event) => event.type === 'batch')

    expect(first?.checkpoint).toEqual({ labelIndex: 0, pageToken: '1', processed: 1 })
  })

  it('aborts cleanly', async () => {
    const controller = new AbortController()
    controller.abort()
    const gmail = fakeGmail({ L1: [[recent('a', 1)]] })

    await expect(
      collect(runScan(gmail, { ...options, signal: controller.signal })),
    ).rejects.toBeInstanceOf(AbortedError)
  })
})
