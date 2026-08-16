import { describe, expect, it, vi } from 'vitest'
import type { SenderAggregate } from '@/core/aggregate/senders'
import { createExecutor } from '@/core/unsubscribe/executor'
import { runUnsubscribeQueue, summarise } from '@/core/unsubscribe/queue'
import type { QueueEvent, UnsubscribeResult } from '@/core/unsubscribe/queue'
import { buildComposeUrl, buildSenderSearchUrl, parseMailto } from '@/core/unsubscribe/targets'
import type { UnsubscribeMethod } from '@/core/parse/unsubscribe'

function sender(key: string, method: UnsubscribeMethod, target?: string): SenderAggregate {
  return {
    key,
    displayName: key,
    domain: key.split('@')[1] ?? '',
    totalCount: 1,
    unreadCount: 1,
    archivedCount: 0,
    engagedCount: 0,
    firstSeen: 0,
    lastSeen: 0,
    unsubscribe: target === undefined ? { method } : { method, target },
    status: 'pending',
  }
}

async function collect(generator: AsyncGenerator<QueueEvent>): Promise<QueueEvent[]> {
  const events: QueueEvent[] = []
  for await (const event of generator) events.push(event)
  return events
}

const noSleep = { sleep: () => Promise.resolve() }

describe('parseMailto', () => {
  it('reads the address and the query parts', () => {
    expect(parseMailto('mailto:stop@x.fr?subject=Unsubscribe&body=please')).toEqual({
      to: 'stop@x.fr',
      subject: 'Unsubscribe',
      body: 'please',
    })
  })

  it('accepts a bare address', () => {
    expect(parseMailto('mailto:stop@x.fr')?.to).toBe('stop@x.fr')
  })

  it('rejects anything that is not a usable mailto', () => {
    expect(parseMailto('https://x.fr')).toBeNull()
    expect(parseMailto('mailto:')).toBeNull()
    expect(parseMailto('mailto:notanaddress')).toBeNull()
  })
})

describe('buildComposeUrl', () => {
  it('produces a Gmail compose link carrying the subject', () => {
    const url = buildComposeUrl('mailto:stop@x.fr?subject=Unsubscribe')
    expect(url).toContain('view=cm')
    expect(url).toContain('to=stop%40x.fr')
    expect(url).toContain('su=Unsubscribe')
  })

  it('returns null for an unusable target', () => {
    expect(buildComposeUrl('mailto:')).toBeNull()
  })
})

describe('buildSenderSearchUrl', () => {
  it('searches by sender rather than linking a stored message id', () => {
    expect(buildSenderSearchUrl('news@x.fr')).toContain(encodeURIComponent('from:news@x.fr'))
  })
})

describe('createExecutor', () => {
  const openTab = vi.fn((_url: string) => Promise.resolve())

  it('posts one-click when host access is granted', async () => {
    const post = vi.fn(() => Promise.resolve({ ok: true, status: 200, detail: 'Unsubscribed' }))
    const execute = createExecutor({ hostAccess: true, openTab, post })

    const outcome = await execute(sender('a@x.fr', 'one-click', 'https://x.fr/u'))

    expect(outcome.status).toBe('done')
    expect(post).toHaveBeenCalledWith('https://x.fr/u')
  })

  it('opens the page instead of posting when host access was refused', async () => {
    const post = vi.fn()
    const opened = vi.fn((_url: string) => Promise.resolve())
    const execute = createExecutor({ hostAccess: false, openTab: opened, post })

    const outcome = await execute(sender('a@x.fr', 'one-click', 'https://x.fr/u'))

    expect(post).not.toHaveBeenCalled()
    expect(opened).toHaveBeenCalledWith('https://x.fr/u')
    expect(outcome.status).toBe('needs-confirmation')
  })

  it('falls back to the page when the post is rejected', async () => {
    const post = vi.fn(() => Promise.resolve({ ok: false, status: 403, detail: 'Rejected' }))
    const opened = vi.fn((_url: string) => Promise.resolve())
    const execute = createExecutor({ hostAccess: true, openTab: opened, post })

    const outcome = await execute(sender('a@x.fr', 'one-click', 'https://x.fr/u'))

    expect(opened).toHaveBeenCalledWith('https://x.fr/u')
    expect(outcome.status).toBe('needs-confirmation')
  })

  it('never posts to a plain link, even with host access', async () => {
    const post = vi.fn()
    const execute = createExecutor({ hostAccess: true, openTab, post })

    await execute(sender('a@x.fr', 'http', 'https://x.fr/u'))

    expect(post).not.toHaveBeenCalled()
  })

  it('opens a compose window for mailto', async () => {
    const opened = vi.fn((_url: string) => Promise.resolve())
    const execute = createExecutor({ hostAccess: true, openTab: opened })

    await execute(sender('a@x.fr', 'mailto', 'mailto:stop@x.fr'))

    expect(opened.mock.calls[0]?.[0]).toContain('view=cm')
  })

  it('searches Gmail when there is no unsubscribe route at all', async () => {
    const opened = vi.fn((_url: string) => Promise.resolve())
    const execute = createExecutor({ hostAccess: true, openTab: opened })

    await execute(sender('a@x.fr', 'none'))

    expect(opened.mock.calls[0]?.[0]).toContain('search')
  })

  it('fails cleanly when a target is missing', async () => {
    const execute = createExecutor({ hostAccess: true, openTab })
    expect((await execute(sender('a@x.fr', 'http'))).status).toBe('failed')
  })
})

describe('runUnsubscribeQueue', () => {
  it('processes senders one at a time and reports each', async () => {
    const events = await collect(
      runUnsubscribeQueue(
        [sender('a@x.fr', 'http', 'https://a'), sender('b@x.fr', 'http', 'https://b')],
        () => Promise.resolve({ status: 'done', detail: 'ok' }),
        noSleep,
      ),
    )

    const results = events.filter((event) => event.type === 'result')
    expect(results.map((event) => event.result.key)).toEqual(['a@x.fr', 'b@x.fr'])
  })

  it('keeps going after one sender throws', async () => {
    const executor = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue({ status: 'done', detail: 'ok' })

    const events = await collect(
      runUnsubscribeQueue(
        [sender('a@x.fr', 'http', 'https://a'), sender('b@x.fr', 'http', 'https://b')],
        executor,
        noSleep,
      ),
    )

    const finished = events.find((event) => event.type === 'finished')
    expect(finished?.results.map((result) => result.status)).toEqual(['failed', 'done'])
    expect(finished?.results[0]?.detail).toBe('boom')
  })

  it('stops when cancelled and says so', async () => {
    const controller = new AbortController()
    const executor = vi.fn(() => {
      controller.abort()
      return Promise.resolve({ status: 'done' as const, detail: 'ok' })
    })

    const events = await collect(
      runUnsubscribeQueue(
        [sender('a@x.fr', 'http', 'https://a'), sender('b@x.fr', 'http', 'https://b')],
        executor,
        { ...noSleep, signal: controller.signal },
      ),
    )

    const finished = events.find((event) => event.type === 'finished')
    expect(finished?.cancelled).toBe(true)
    expect(finished?.results).toHaveLength(1)
    expect(executor).toHaveBeenCalledTimes(1)
  })

  it('spaces requests apart', async () => {
    const sleep = vi.fn((_ms: number) => Promise.resolve())

    await collect(
      runUnsubscribeQueue(
        [
          sender('a@x.fr', 'http', 'https://a'),
          sender('b@x.fr', 'http', 'https://b'),
          sender('c@x.fr', 'http', 'https://c'),
        ],
        () => Promise.resolve({ status: 'done', detail: 'ok' }),
        { sleep },
      ),
    )

    // Between items only, never after the last one.
    expect(sleep).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenCalledWith(500)
  })
})

describe('summarise', () => {
  it('counts each outcome', () => {
    const results: UnsubscribeResult[] = [
      { key: 'a', status: 'done', detail: '' },
      { key: 'b', status: 'done', detail: '' },
      { key: 'c', status: 'failed', detail: '' },
    ]

    expect(summarise(results)).toEqual({ done: 2, 'needs-confirmation': 0, failed: 1 })
  })
})
