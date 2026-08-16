import { isEngaged, sortByIgnored, unreadRate } from './senders'
import type { SenderAggregate } from './senders'

export const FILTERS = ['all', 'never-opened', 'mostly-unread', 'dormant'] as const
export const SORTS = ['ignored', 'volume', 'recent'] as const

export type SenderFilter = (typeof FILTERS)[number]
export type SortKey = (typeof SORTS)[number]

export const DORMANT_DAYS = 180

const DAY_MS = 24 * 60 * 60 * 1000

export function matchesFilter(sender: SenderAggregate, filter: SenderFilter, now: number): boolean {
  switch (filter) {
    case 'never-opened':
      return sender.totalCount > 0 && sender.unreadCount === sender.totalCount
    case 'mostly-unread':
      return unreadRate(sender) >= 0.8
    case 'dormant':
      return sender.lastSeen > 0 && sender.lastSeen < now - DORMANT_DAYS * DAY_MS
    case 'all':
      return true
  }
}

/** Matches the display name, the address and the domain, since a sender is recognisable by any of them. */
export function matchesQuery(sender: SenderAggregate, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (needle === '') return true

  return (
    sender.displayName.toLowerCase().includes(needle) ||
    sender.key.includes(needle) ||
    sender.domain.includes(needle)
  )
}

export function applySort(senders: readonly SenderAggregate[], key: SortKey): SenderAggregate[] {
  if (key === 'ignored') return sortByIgnored(senders)
  if (key === 'volume') return [...senders].sort((a, b) => b.totalCount - a.totalCount)
  return [...senders].sort((a, b) => b.lastSeen - a.lastSeen)
}

export type ViewOptions = {
  filter: SenderFilter
  query: string
  sort: SortKey
  now: number
  includeHandled?: boolean
}

export function selectView(
  senders: readonly SenderAggregate[],
  { filter, query, sort, now, includeHandled = false }: ViewOptions,
): SenderAggregate[] {
  const visible = senders.filter(
    (sender) =>
      (includeHandled || sender.status === 'pending') &&
      matchesFilter(sender, filter, now) &&
      matchesQuery(sender, query),
  )

  return applySort(visible, sort)
}

export function filterCounts(
  senders: readonly SenderAggregate[],
  now: number,
): Record<SenderFilter, number> {
  const counts = { all: 0, 'never-opened': 0, 'mostly-unread': 0, dormant: 0 }

  for (const sender of senders) {
    if (sender.status !== 'pending') continue
    for (const filter of FILTERS) {
      if (matchesFilter(sender, filter, now)) counts[filter] += 1
    }
  }

  return counts
}

/**
 * Engaged senders are surfaced separately rather than hidden. Suppressing them
 * outright would leave a user hunting for a sender the tool decided not to show.
 */
export function partitionEngaged(senders: readonly SenderAggregate[]): {
  ignored: SenderAggregate[]
  engaged: SenderAggregate[]
} {
  return {
    ignored: senders.filter((sender) => !isEngaged(sender)),
    engaged: senders.filter(isEngaged),
  }
}
