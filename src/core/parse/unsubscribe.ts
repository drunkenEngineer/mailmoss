export type UnsubscribeMethod = 'one-click' | 'http' | 'mailto' | 'none'

export type UnsubscribeTarget = {
  method: UnsubscribeMethod
  target?: string
}

export type ListUnsubscribeTargets = {
  https: string[]
  mailto: string[]
}

const BRACKETED = /<([^>]+)>/g

/**
 * Values are angle-bracketed and comma-separated, but headers arrive folded
 * across lines and some senders omit the brackets entirely, so brackets are
 * matched where present and commas are only a fallback.
 */
export function parseListUnsubscribe(header: string | undefined): ListUnsubscribeTargets {
  const targets: ListUnsubscribeTargets = { https: [], mailto: [] }
  if (!header) return targets

  const matches = [...header.matchAll(BRACKETED)].map((match) => match[1] ?? '')
  const candidates = matches.length > 0 ? matches : header.split(',')

  for (const candidate of candidates) {
    const value = candidate.trim().replace(/\s+/g, '')
    if (value === '') continue

    const lower = value.toLowerCase()
    if (lower.startsWith('https://')) targets.https.push(value)
    else if (lower.startsWith('mailto:')) targets.mailto.push(value)
  }

  return targets
}

/** RFC 8058 signals one-click support with exactly this header value. */
export function hasOneClick(postHeader: string | undefined): boolean {
  if (!postHeader) return false
  return postHeader.toLowerCase().replace(/\s+/g, '').includes('list-unsubscribe=one-click')
}

/**
 * One-click is only claimed when the sender both advertises it and offers an
 * https endpoint. Anything else degrades to something the user confirms, so a
 * silent POST is never sent to a URL that has not opted in.
 */
export function resolveUnsubscribe(
  listUnsubscribe: string | undefined,
  listUnsubscribePost: string | undefined,
): UnsubscribeTarget {
  const { https, mailto } = parseListUnsubscribe(listUnsubscribe)
  const firstHttps = https[0]
  const firstMailto = mailto[0]

  if (firstHttps !== undefined) {
    return {
      method: hasOneClick(listUnsubscribePost) ? 'one-click' : 'http',
      target: firstHttps,
    }
  }

  if (firstMailto !== undefined) {
    return { method: 'mailto', target: firstMailto }
  }

  return { method: 'none' }
}
