import { GmailError, classify, readErrorBody } from './errors'

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1'

export type QueryValue = string | number | string[] | undefined

export type GmailRequest = {
  path: string
  params?: Record<string, QueryValue>
  signal?: AbortSignal
}

// The token arrives as an argument rather than being read from chrome.identity
// here, so this module stays free of extension APIs and testable in plain Node.
export type GmailFetch = <T>(request: GmailRequest) => Promise<T>

export function buildQuery(params: Record<string, QueryValue> = {}): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue

    if (Array.isArray(value)) {
      // Gmail expects repeated keys, not a joined list, for metadataHeaders.
      for (const item of value) search.append(key, item)
    } else {
      search.append(key, String(value))
    }
  }

  return search.toString()
}

export function createGmailFetch(token: string, fetchImpl: typeof fetch = fetch): GmailFetch {
  return async function gmailFetch<T>({ path, params, signal }: GmailRequest): Promise<T> {
    const query = buildQuery(params)
    const url = `${GMAIL_BASE}${path}${query ? `?${query}` : ''}`

    let response: Response
    try {
      const init: RequestInit = { headers: { Authorization: `Bearer ${token}` } }
      if (signal) init.signal = signal
      response = await fetchImpl(url, init)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Network request failed'
      throw new GmailError('network', 0, '', message)
    }

    const body: unknown = await response.json().catch(() => ({}))

    if (!response.ok) {
      const { reason, message } = readErrorBody(body)
      throw new GmailError(classify(response.status, reason), response.status, reason, message)
    }

    return body as T
  }
}
