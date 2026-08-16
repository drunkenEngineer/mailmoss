import { describe, expect, it } from 'vitest'
import { DORMANT_DAYS, filterCounts, matchesQuery, selectView } from '@/core/aggregate/filter'
import type { SenderAggregate } from '@/core/aggregate/senders'

const NOW = 1_800_000_000_000
const DAY = 24 * 60 * 60 * 1000

function sender(overrides: Partial<SenderAggregate> & { key: string }): SenderAggregate {
  return {
    displayName: '',
    domain: overrides.key.split('@')[1] ?? '',
    totalCount: 10,
    unreadCount: 10,
    archivedCount: 0,
    engagedCount: 0,
    firstSeen: NOW - DAY,
    lastSeen: NOW - DAY,
    unsubscribe: { method: 'none' },
    status: 'pending',
    ...overrides,
  }
}

const base = {
  filter: 'all' as const,
  query: '',
  sort: 'ignored' as const,
  now: NOW,
}

describe('selectView', () => {
  it('hides handled senders unless asked for', () => {
    const senders = [sender({ key: 'a@x.fr' }), sender({ key: 'b@x.fr', status: 'ignored' })]

    expect(selectView(senders, base).map((s) => s.key)).toEqual(['a@x.fr'])
    expect(selectView(senders, { ...base, includeHandled: true })).toHaveLength(2)
  })

  it('filters to senders that were never opened', () => {
    const senders = [
      sender({ key: 'never@x.fr', unreadCount: 10, totalCount: 10 }),
      sender({ key: 'some@x.fr', unreadCount: 9, totalCount: 10 }),
    ]

    expect(selectView(senders, { ...base, filter: 'never-opened' }).map((s) => s.key)).toEqual([
      'never@x.fr',
    ])
  })

  it('treats 80% unread as the boundary, inclusive', () => {
    const senders = [
      sender({ key: 'at@x.fr', unreadCount: 8, totalCount: 10 }),
      sender({ key: 'below@x.fr', unreadCount: 7, totalCount: 10 }),
    ]

    expect(selectView(senders, { ...base, filter: 'mostly-unread' }).map((s) => s.key)).toEqual([
      'at@x.fr',
    ])
  })

  it('finds dormant senders by last seen', () => {
    const senders = [
      sender({ key: 'old@x.fr', lastSeen: NOW - (DORMANT_DAYS + 1) * DAY }),
      sender({ key: 'recent@x.fr', lastSeen: NOW - DAY }),
    ]

    expect(selectView(senders, { ...base, filter: 'dormant' }).map((s) => s.key)).toEqual([
      'old@x.fr',
    ])
  })

  it('sorts by volume or recency on request', () => {
    const senders = [
      sender({ key: 'small@x.fr', totalCount: 5, lastSeen: NOW }),
      sender({ key: 'big@x.fr', totalCount: 50, lastSeen: NOW - 10 * DAY }),
    ]

    expect(selectView(senders, { ...base, sort: 'volume' })[0]?.key).toBe('big@x.fr')
    expect(selectView(senders, { ...base, sort: 'recent' })[0]?.key).toBe('small@x.fr')
  })

  it('combines filter, search and sort', () => {
    const senders = [
      sender({ key: 'news@shop.fr', displayName: 'Shop', totalCount: 30 }),
      sender({ key: 'news@other.fr', displayName: 'Other', totalCount: 90 }),
    ]

    const view = selectView(senders, { ...base, query: 'shop', sort: 'volume' })
    expect(view.map((s) => s.key)).toEqual(['news@shop.fr'])
  })
})

describe('matchesQuery', () => {
  const row = sender({ key: 'newsletter@lemonde.fr', displayName: 'Le Monde' })

  it('matches name, address and domain', () => {
    expect(matchesQuery(row, 'monde')).toBe(true)
    expect(matchesQuery(row, 'newsletter')).toBe(true)
    expect(matchesQuery(row, 'lemonde.fr')).toBe(true)
  })

  it('ignores case and surrounding space', () => {
    expect(matchesQuery(row, '  LE MONDE ')).toBe(true)
  })

  it('matches everything on an empty query', () => {
    expect(matchesQuery(row, '   ')).toBe(true)
  })

  it('rejects a miss', () => {
    expect(matchesQuery(row, 'figaro')).toBe(false)
  })
})

describe('filterCounts', () => {
  it('counts each filter independently and skips handled senders', () => {
    const senders = [
      sender({ key: 'a@x.fr' }),
      sender({ key: 'b@x.fr', lastSeen: NOW - (DORMANT_DAYS + 1) * DAY }),
      sender({ key: 'c@x.fr', status: 'ignored' }),
    ]

    expect(filterCounts(senders, NOW)).toEqual({
      all: 2,
      'never-opened': 2,
      'mostly-unread': 2,
      dormant: 1,
    })
  })
})
