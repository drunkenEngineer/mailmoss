import { describe, expect, it } from 'vitest'
import { aggregate, isEngaged, sortByIgnored, unreadRate } from '@/core/aggregate/senders'
import type { GmailMessageMetadata } from '@/core/gmail/types'

let counter = 0

function message(options: {
  from: string
  labels?: string[]
  date?: number
  listUnsubscribe?: string
  oneClick?: boolean
}): GmailMessageMetadata {
  counter += 1
  const headers = [{ name: 'From', value: options.from }]
  if (options.listUnsubscribe !== undefined) {
    headers.push({ name: 'List-Unsubscribe', value: options.listUnsubscribe })
  }
  if (options.oneClick === true) {
    headers.push({ name: 'List-Unsubscribe-Post', value: 'List-Unsubscribe=One-Click' })
  }

  return {
    id: `m${String(counter)}`,
    threadId: `t${String(counter)}`,
    labelIds: options.labels ?? ['INBOX', 'UNREAD'],
    internalDate: String(options.date ?? 1_700_000_000_000),
    payload: { headers },
  }
}

describe('aggregate', () => {
  it('groups by address and counts labels', () => {
    const rows = aggregate([
      message({ from: 'News <a@x.fr>', labels: ['INBOX', 'UNREAD'] }),
      message({ from: 'News <a@x.fr>', labels: ['INBOX'] }),
      message({ from: 'News <A@X.FR>', labels: ['UNREAD'] }),
    ])

    const row = rows.get('a@x.fr')
    expect(row?.totalCount).toBe(3)
    expect(row?.unreadCount).toBe(2)
    expect(row?.archivedCount).toBe(1)
    expect(row?.domain).toBe('x.fr')
  })

  it('tracks the first and last time a sender was seen', () => {
    const rows = aggregate([
      message({ from: 'a@x.fr', date: 3000 }),
      message({ from: 'a@x.fr', date: 1000 }),
      message({ from: 'a@x.fr', date: 2000 }),
    ])

    expect(rows.get('a@x.fr')?.firstSeen).toBe(1000)
    expect(rows.get('a@x.fr')?.lastSeen).toBe(3000)
  })

  it('counts starred and important as engagement', () => {
    const rows = aggregate([
      message({ from: 'a@x.fr', labels: ['INBOX', 'STARRED'] }),
      message({ from: 'a@x.fr', labels: ['INBOX', 'IMPORTANT'] }),
      message({ from: 'a@x.fr', labels: ['INBOX', 'UNREAD'] }),
    ])

    expect(rows.get('a@x.fr')?.engagedCount).toBe(2)
  })

  it('keeps the best unsubscribe method found across a sender', () => {
    const rows = aggregate([
      message({ from: 'a@x.fr' }),
      message({ from: 'a@x.fr', listUnsubscribe: '<https://x.fr/u>', oneClick: true }),
    ])

    expect(rows.get('a@x.fr')?.unsubscribe).toEqual({
      method: 'one-click',
      target: 'https://x.fr/u',
    })
  })

  it('skips messages with an unusable From header', () => {
    expect(aggregate([message({ from: 'garbage' })]).size).toBe(0)
  })

  it('merges into an existing map so passes can accumulate', () => {
    const first = aggregate([message({ from: 'a@x.fr' })])
    const merged = aggregate([message({ from: 'a@x.fr' })], first)

    expect(merged.get('a@x.fr')?.totalCount).toBe(2)
  })
})

describe('sortByIgnored', () => {
  it('puts the most ignored first and holds engaged senders back', () => {
    const rows = [
      ...aggregate([
        message({ from: 'engaged@x.fr', labels: ['INBOX', 'UNREAD', 'STARRED'] }),
        message({ from: 'ignored@x.fr', labels: ['UNREAD'] }),
        message({ from: 'read@x.fr', labels: ['INBOX'] }),
      ]).values(),
    ]

    expect(sortByIgnored(rows).map((row) => row.key)).toEqual([
      'ignored@x.fr',
      'read@x.fr',
      'engaged@x.fr',
    ])
  })
})

describe('unreadRate', () => {
  it('is zero for a sender with no messages rather than NaN', () => {
    expect(
      unreadRate({
        key: '',
        displayName: '',
        domain: '',
        totalCount: 0,
        unreadCount: 0,
        archivedCount: 0,
        engagedCount: 0,
        firstSeen: 0,
        lastSeen: 0,
        unsubscribe: { method: 'none' },
        status: 'pending',
      }),
    ).toBe(0)
  })

  it('reports engagement from any starred or important message', () => {
    const row = [...aggregate([message({ from: 'a@x.fr', labels: ['STARRED'] })]).values()][0]
    expect(row && isEngaged(row)).toBe(true)
  })
})
