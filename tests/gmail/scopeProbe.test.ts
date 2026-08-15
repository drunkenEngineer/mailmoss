import { describe, expect, it } from 'vitest'
import type { GmailFetch, GmailRequest } from '@/core/gmail/client'
import { GmailError } from '@/core/gmail/errors'
import { decide, probeMetadataScope } from '@/core/gmail/scopeProbe'
import type { ProbeOutcome } from '@/core/gmail/scopeProbe'

const outcome = (id: ProbeOutcome['id'], ok: boolean): ProbeOutcome => ({
  id,
  question: '',
  ok,
  detail: '',
})

describe('decide', () => {
  it('keeps the metadata scope and query scanning when q works', () => {
    expect(decide([outcome('search-query', true), outcome('label-filter', true)]).strategy).toBe(
      'query',
    )
  })

  it('falls back to label scanning when only labelIds works', () => {
    expect(decide([outcome('search-query', false), outcome('label-filter', true)]).strategy).toBe(
      'labels',
    )
  })

  it('gives up the metadata scope when neither listing call works', () => {
    expect(decide([outcome('search-query', false), outcome('label-filter', false)]).strategy).toBe(
      'readonly-fallback',
    )
  })
})

function fakeFetch(handler: (request: GmailRequest) => unknown): GmailFetch {
  return <T>(request: GmailRequest) => Promise.resolve(handler(request) as T)
}

describe('probeMetadataScope', () => {
  it('records a rejection as a result instead of throwing', async () => {
    const report = await probeMetadataScope(
      fakeFetch((request) => {
        if (request.params?.q !== undefined) {
          throw new GmailError(
            'forbidden',
            403,
            'failedPrecondition',
            'Metadata scope does not support q',
          )
        }
        if (request.path.includes('/messages/')) {
          return { payload: { headers: [{ name: 'List-Unsubscribe', value: '<https://x>' }] } }
        }
        return { messages: [{ id: 'abc', threadId: 't' }], resultSizeEstimate: 12 }
      }),
    )

    expect(report.outcomes.map((o) => o.ok)).toEqual([false, true, true])
    expect(report.strategy).toBe('labels')
    expect(report.outcomes[0]?.detail).toContain('403')
    expect(report.outcomes[0]?.detail).toContain('failedPrecondition')
  })

  it('skips the header check when no message can be sampled', async () => {
    const report = await probeMetadataScope(
      fakeFetch(() => {
        throw new GmailError('forbidden', 403, 'insufficientPermissions', 'denied')
      }),
    )

    expect(report.strategy).toBe('readonly-fallback')
    expect(report.outcomes[2]?.detail).toContain('Skipped')
  })

  it('reports the best case when every call is accepted', async () => {
    const report = await probeMetadataScope(
      fakeFetch((request) =>
        request.path.includes('/messages/')
          ? { payload: { headers: [{ name: 'From', value: 'a@b.c' }] } }
          : { messages: [{ id: 'abc', threadId: 't' }], resultSizeEstimate: 3 },
      ),
    )

    expect(report.strategy).toBe('query')
    expect(report.outcomes.every((o) => o.ok)).toBe(true)
  })
})
