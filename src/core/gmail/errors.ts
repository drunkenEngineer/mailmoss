export type GmailErrorKind =
  'auth' | 'forbidden' | 'rate-limit' | 'not-found' | 'network' | 'unknown'

export class GmailError extends Error {
  constructor(
    readonly kind: GmailErrorKind,
    readonly status: number,
    readonly reason: string,
    message: string,
  ) {
    super(message)
    this.name = 'GmailError'
  }
}

type GoogleErrorBody = {
  error?: {
    code?: number
    message?: string
    status?: string
    errors?: { reason?: string; message?: string }[]
  }
}

const RATE_LIMIT_REASONS = new Set([
  'rateLimitExceeded',
  'userRateLimitExceeded',
  'quotaExceeded',
  'dailyLimitExceeded',
])

export function readErrorBody(body: unknown): { reason: string; message: string } {
  const parsed = body as GoogleErrorBody
  const error = parsed.error

  return {
    reason: error?.errors?.[0]?.reason ?? error?.status ?? '',
    message: error?.message ?? 'Unknown Gmail API error',
  }
}

// A 403 means two very different things depending on the reason: throttling,
// which is worth retrying, or a scope the token does not carry, which never is.
export function classify(status: number, reason: string): GmailErrorKind {
  if (status === 401) return 'auth'
  if (status === 429) return 'rate-limit'
  if (status === 403) return RATE_LIMIT_REASONS.has(reason) ? 'rate-limit' : 'forbidden'
  if (status === 404) return 'not-found'
  return 'unknown'
}

export function isRetryable(error: GmailError): boolean {
  return error.kind === 'rate-limit' || error.kind === 'network'
}
