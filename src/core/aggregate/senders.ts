import { headerValue } from '../gmail/collect'
import type { GmailMessageMetadata } from '../gmail/types'
import { parseFrom } from '../parse/address'
import { resolveUnsubscribe } from '../parse/unsubscribe'
import type { UnsubscribeTarget } from '../parse/unsubscribe'

export type SenderStatus = 'pending' | 'unsubscribed' | 'ignored' | 'failed'

export type SenderAggregate = {
  key: string
  displayName: string
  domain: string
  totalCount: number
  unreadCount: number
  archivedCount: number
  engagedCount: number
  firstSeen: number
  lastSeen: number
  unsubscribe: UnsubscribeTarget
  status: SenderStatus
}

function hasLabel(message: GmailMessageMetadata, label: string): boolean {
  return message.labelIds?.includes(label) ?? false
}

// Archived means the user moved it out of the inbox without deleting it, which
// in bulk usually means they cleared it unread rather than read it.
function isArchived(message: GmailMessageMetadata): boolean {
  return !hasLabel(message, 'INBOX') && !hasLabel(message, 'TRASH')
}

function isEngagedMessage(message: GmailMessageMetadata): boolean {
  return hasLabel(message, 'STARRED') || hasLabel(message, 'IMPORTANT')
}

export function aggregate(
  messages: readonly GmailMessageMetadata[],
  into: Map<string, SenderAggregate> = new Map(),
): Map<string, SenderAggregate> {
  for (const message of messages) {
    const from = parseFrom(headerValue(message, 'From'))
    if (!from) continue

    const timestamp = Number(message.internalDate)
    const seen = Number.isFinite(timestamp) ? timestamp : 0

    const existing = into.get(from.address)
    const row: SenderAggregate = existing ?? {
      key: from.address,
      displayName: from.displayName,
      domain: from.domain,
      totalCount: 0,
      unreadCount: 0,
      archivedCount: 0,
      engagedCount: 0,
      firstSeen: seen,
      lastSeen: seen,
      unsubscribe: { method: 'none' },
      status: 'pending',
    }

    row.totalCount += 1
    if (hasLabel(message, 'UNREAD')) row.unreadCount += 1
    if (isArchived(message)) row.archivedCount += 1
    if (isEngagedMessage(message)) row.engagedCount += 1

    if (seen > 0) {
      row.firstSeen = row.firstSeen === 0 ? seen : Math.min(row.firstSeen, seen)
      row.lastSeen = Math.max(row.lastSeen, seen)
    }

    // A sender's own unsubscribe details can appear on some messages and not
    // others, so the best method found across all of them wins.
    if (row.unsubscribe.method === 'none') {
      row.unsubscribe = resolveUnsubscribe(
        headerValue(message, 'List-Unsubscribe'),
        headerValue(message, 'List-Unsubscribe-Post'),
      )
    }

    if (row.displayName === '' && from.displayName !== '') row.displayName = from.displayName

    into.set(row.key, row)
  }

  return into
}

/**
 * Rescanning rebuilds every row from messages, which knows nothing about what
 * the user already did. Without carrying the statuses over, a sender you
 * unsubscribed from last week reappears as untouched the next time you scan.
 */
export function carryStatuses(
  rows: Map<string, SenderAggregate>,
  previous: ReadonlyMap<string, SenderStatus>,
): Map<string, SenderAggregate> {
  for (const [key, status] of previous) {
    const row = rows.get(key)
    // Only fills gaps: a status set during this run always wins.
    if (row && row.status === 'pending') row.status = status
  }
  return rows
}

export function handledStatuses(senders: readonly SenderAggregate[]): Map<string, SenderStatus> {
  return new Map(
    senders.filter((sender) => sender.status !== 'pending').map((s) => [s.key, s.status]),
  )
}

export function unreadRate(sender: SenderAggregate): number {
  return sender.totalCount === 0 ? 0 : sender.unreadCount / sender.totalCount
}

export function isEngaged(sender: SenderAggregate): boolean {
  return sender.engagedCount > 0
}

/**
 * Most ignored first. Engaged senders are held back regardless of unread rate:
 * a newsletter you star occasionally is not one to offer up for removal.
 */
export function sortByIgnored(senders: readonly SenderAggregate[]): SenderAggregate[] {
  return [...senders].sort((a, b) => {
    if (isEngaged(a) !== isEngaged(b)) return isEngaged(a) ? 1 : -1
    const byRate = unreadRate(b) - unreadRate(a)
    return byRate !== 0 ? byRate : b.totalCount - a.totalCount
  })
}
