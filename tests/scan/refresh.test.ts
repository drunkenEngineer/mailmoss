import { describe, expect, it, vi } from 'vitest'
import type { GmailFetch, GmailRequest } from '@/core/gmail/client'
import { GmailError } from '@/core/gmail/errors'
import { listHistory, maxHistoryId } from '@/core/gmail/history'
import { refreshSince } from '@/core/scan/refresh'

function fake(handler: (request: GmailRequest) => unknown): GmailFetch {
  return <T>(request: GmailRequest) => Promise.resolve(handler(request) as T)
}

describe('maxHistoryId', () => {
  it('compares numerically, not lexically', () => {
    expect(maxHistoryId('9', '10')).toBe('10')
    expect(maxHistoryId('100', '99')).toBe('100')
  })

  it('handles ids beyond what a Number holds exactly', () => {
    expect(maxHistoryId('9007199254740993', '9007199254740992')).toBe('9007199254740993')
  })

  it('takes whichever side is present when one is empty', () => {
    expect(maxHistoryId('', '5')).toBe('5')
    expect(maxHistoryId('5', '')).toBe('5')
  })

  it('does not throw on rubbish', () => {
    expect(() => maxHistoryId('abc', '5')).not.toThrow()
  })
})

describe('listHistory', () => {
  it('collects added message ids across pages and deduplicates', async () => {
    const pages = [
      {
        history: [
          { id: '1', messagesAdded: [{ message: { id: 'a', threadId: 't' } }] },
          { id: '2', messagesAdded: [{ message: { id: 'a', threadId: 't' } }] },
        ],
        nextPageToken: 'p2',
        historyId: '10',
      },
      {
        history: [{ id: '3', messagesAdded: [{ message: { id: 'b', threadId: 't' } }] }],
        historyId: '12',
      },
    ]
    let call = 0

    const delta = await listHistory(
      fake(() => pages[call++]),
      { startHistoryId: '5' },
    )

    expect(delta.messageIds.sort()).toEqual(['a', 'b'])
    expect(delta.historyId).toBe('12')
  })

  it('reports the current history id even when nothing changed', async () => {
    const delta = await listHistory(
      fake(() => ({ historyId: '77' })),
      { startHistoryId: '77' },
    )

    expect(delta.messageIds).toEqual([])
    expect(delta.historyId).toBe('77')
  })
})

describe('refreshSince', () => {
  const labels = ['L1', 'L2']

  it('reports up-to-date without fetching any metadata', async () => {
    const gmail = vi.fn(() => Promise.resolve({ historyId: '20' }))
    const result = await refreshSince(gmail as unknown as GmailFetch, '20', { labels })

    expect(result.status).toBe('up-to-date')
    expect(result.status === 'up-to-date' && result.historyId).toBe('20')
  })

  it('fetches metadata for new messages across every label', async () => {
    const result = await refreshSince(
      fake((request) => {
        if (request.path.startsWith('/users/me/messages/')) {
          const id = request.path.split('/').pop() ?? ''
          return { id, threadId: id, labelIds: ['INBOX'], internalDate: '1', payload: {} }
        }
        const label = String(request.params?.labelId ?? '')
        return {
          history: [
            { id: '1', messagesAdded: [{ message: { id: `msg-${label}`, threadId: 't' } }] },
          ],
          historyId: '30',
        }
      }),
      '20',
      { labels },
    )

    expect(result.status).toBe('updated')
    expect(result.status === 'updated' && result.messages.map((m) => m.id).sort()).toEqual([
      'msg-L1',
      'msg-L2',
    ])
  })

  it('reports too-old rather than throwing when history has expired', async () => {
    const result = await refreshSince(
      fake(() => {
        throw new GmailError('not-found', 404, 'notFound', 'Requested entity was not found')
      }),
      '1',
      { labels },
    )

    expect(result.status).toBe('too-old')
  })

  it('lets other failures through instead of hiding them', async () => {
    await expect(
      refreshSince(
        fake(() => {
          throw new GmailError('auth', 401, '', 'expired')
        }),
        '1',
        { labels },
      ),
    ).rejects.toBeInstanceOf(GmailError)
  })
})
