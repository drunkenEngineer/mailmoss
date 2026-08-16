const GMAIL_COMPOSE = 'https://mail.google.com/mail/'
const GMAIL_SEARCH = 'https://mail.google.com/mail/u/0/#search/'

export type MailtoParts = {
  to: string
  subject?: string
  body?: string
}

export function parseMailto(value: string): MailtoParts | null {
  if (!value.toLowerCase().startsWith('mailto:')) return null

  const withoutScheme = value.slice('mailto:'.length)
  const [rawTo = '', rawQuery = ''] = withoutScheme.split('?', 2)
  const to = decodeURIComponent(rawTo).trim()
  if (to === '' || !to.includes('@')) return null

  const query = new URLSearchParams(rawQuery)
  const subject = query.get('subject')
  const body = query.get('body')

  return {
    to,
    ...(subject === null ? {} : { subject }),
    ...(body === null ? {} : { body }),
  }
}

/**
 * Opens a pre-filled Gmail compose window rather than sending the mail
 * ourselves, which would need the gmail.send scope for a case that comes up
 * rarely. The user presses send.
 */
export function buildComposeUrl(mailto: string): string | null {
  const parts = parseMailto(mailto)
  if (!parts) return null

  const params = new URLSearchParams({ view: 'cm', fs: '1', to: parts.to })
  if (parts.subject !== undefined) params.set('su', parts.subject)
  if (parts.body !== undefined) params.set('body', parts.body)

  return `${GMAIL_COMPOSE}?${params.toString()}`
}

/**
 * The last-resort path for senders publishing no unsubscribe header at all.
 * A search by sender is used rather than a link to a specific message, because
 * message identifiers are deliberately never stored.
 */
export function buildSenderSearchUrl(address: string): string {
  return `${GMAIL_SEARCH}${encodeURIComponent(`from:${address}`)}`
}
