import type { GmailFetch } from './client'
import { GmailError } from './errors'
import type { GmailMessageList, GmailMessageMetadata } from './types'

export const PROBE_HEADERS = ['From', 'Date', 'List-Unsubscribe', 'List-Unsubscribe-Post']

export type ProbeId = 'search-query' | 'label-filter' | 'metadata-headers'

export type ProbeOutcome = {
  id: ProbeId
  question: string
  ok: boolean
  detail: string
}

export type ScanStrategy = 'query' | 'labels' | 'readonly-fallback'

export type ProbeReport = {
  outcomes: ProbeOutcome[]
  strategy: ScanStrategy
  verdict: string
}

function describe(error: unknown): string {
  if (error instanceof GmailError) {
    return `${String(error.status)} ${error.kind}${error.reason ? ` (${error.reason})` : ''}: ${error.message}`
  }
  return error instanceof Error ? error.message : 'Unknown failure'
}

// The whole point of this probe is what the metadata scope refuses, so a
// rejection is a result to record rather than an error to propagate.
export async function probeMetadataScope(gmailFetch: GmailFetch): Promise<ProbeReport> {
  const outcomes: ProbeOutcome[] = []
  let sampleId: string | undefined

  try {
    const list = await gmailFetch<GmailMessageList>({
      path: '/users/me/messages',
      params: { q: 'newer_than:1y', maxResults: 1 },
    })
    sampleId = list.messages?.[0]?.id
    outcomes.push({
      id: 'search-query',
      question: 'Does messages.list accept the q parameter?',
      ok: true,
      detail: `Accepted. About ${String(list.resultSizeEstimate)} results.`,
    })
  } catch (error) {
    outcomes.push({
      id: 'search-query',
      question: 'Does messages.list accept the q parameter?',
      ok: false,
      detail: describe(error),
    })
  }

  try {
    const list = await gmailFetch<GmailMessageList>({
      path: '/users/me/messages',
      params: { labelIds: 'CATEGORY_PROMOTIONS', maxResults: 1 },
    })
    sampleId ??= list.messages?.[0]?.id
    outcomes.push({
      id: 'label-filter',
      question: 'Does messages.list accept labelIds?',
      ok: true,
      detail: `Accepted. About ${String(list.resultSizeEstimate)} results.`,
    })
  } catch (error) {
    outcomes.push({
      id: 'label-filter',
      question: 'Does messages.list accept labelIds?',
      ok: false,
      detail: describe(error),
    })
  }

  if (sampleId === undefined) {
    outcomes.push({
      id: 'metadata-headers',
      question: 'Are unsubscribe headers returned by messages.get?',
      ok: false,
      detail: 'Skipped: neither listing call returned a message to inspect.',
    })
  } else {
    try {
      const message = await gmailFetch<GmailMessageMetadata>({
        path: `/users/me/messages/${sampleId}`,
        params: { format: 'metadata', metadataHeaders: PROBE_HEADERS },
      })
      const names = (message.payload?.headers ?? []).map((header) => header.name)
      outcomes.push({
        id: 'metadata-headers',
        question: 'Are unsubscribe headers returned by messages.get?',
        ok: names.length > 0,
        detail: names.length > 0 ? `Returned: ${names.join(', ')}` : 'No headers came back.',
      })
    } catch (error) {
      outcomes.push({
        id: 'metadata-headers',
        question: 'Are unsubscribe headers returned by messages.get?',
        ok: false,
        detail: describe(error),
      })
    }
  }

  return { outcomes, ...decide(outcomes) }
}

export function decide(outcomes: ProbeOutcome[]): { strategy: ScanStrategy; verdict: string } {
  const passed = (id: ProbeId) => outcomes.find((outcome) => outcome.id === id)?.ok === true

  if (passed('search-query')) {
    return {
      strategy: 'query',
      verdict:
        'Best case. Keep gmail.metadata as the default scope and scan with a search query. The privacy claim holds as written.',
    }
  }

  if (passed('label-filter')) {
    return {
      strategy: 'labels',
      verdict:
        'Acceptable. Keep gmail.metadata as the default scope and scan by label, one pass per category. The date window becomes an early stop on internalDate rather than a filter, since a message date is unknown until it has already been fetched.',
    }
  }

  return {
    strategy: 'readonly-fallback',
    verdict:
      'Fall back to gmail.readonly as the default scope. The "we cannot read your emails" claim no longer holds and must be rewritten before any UI is built around it.',
  }
}
