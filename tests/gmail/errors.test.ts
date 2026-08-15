import { describe, expect, it } from 'vitest'
import { GmailError, classify, isRetryable, readErrorBody } from '@/core/gmail/errors'
import { buildQuery } from '@/core/gmail/client'

describe('classify', () => {
  it('treats 401 as an auth failure', () => {
    expect(classify(401, '')).toBe('auth')
  })

  it('treats 429 as rate limiting', () => {
    expect(classify(429, '')).toBe('rate-limit')
  })

  it('separates throttling from scope denial on 403', () => {
    expect(classify(403, 'rateLimitExceeded')).toBe('rate-limit')
    expect(classify(403, 'userRateLimitExceeded')).toBe('rate-limit')
    expect(classify(403, 'insufficientPermissions')).toBe('forbidden')
  })

  it('maps 404 and anything else', () => {
    expect(classify(404, '')).toBe('not-found')
    expect(classify(500, '')).toBe('unknown')
  })
})

describe('isRetryable', () => {
  it('retries throttling and network faults, nothing else', () => {
    expect(isRetryable(new GmailError('rate-limit', 429, '', ''))).toBe(true)
    expect(isRetryable(new GmailError('network', 0, '', ''))).toBe(true)
    expect(isRetryable(new GmailError('forbidden', 403, '', ''))).toBe(false)
    expect(isRetryable(new GmailError('auth', 401, '', ''))).toBe(false)
  })
})

describe('readErrorBody', () => {
  it('pulls the first reason and the message', () => {
    expect(
      readErrorBody({
        error: {
          code: 403,
          message: 'Metadata scope does not support q parameter',
          errors: [{ reason: 'failedPrecondition' }],
        },
      }),
    ).toEqual({
      reason: 'failedPrecondition',
      message: 'Metadata scope does not support q parameter',
    })
  })

  it('survives a body that is not shaped like a Google error', () => {
    expect(readErrorBody({}).message).toBe('Unknown Gmail API error')
    expect(readErrorBody('nonsense').reason).toBe('')
  })
})

describe('buildQuery', () => {
  it('repeats keys for array values rather than joining them', () => {
    expect(buildQuery({ metadataHeaders: ['From', 'List-Unsubscribe'] })).toBe(
      'metadataHeaders=From&metadataHeaders=List-Unsubscribe',
    )
  })

  it('skips undefined and stringifies numbers', () => {
    expect(buildQuery({ maxResults: 500, pageToken: undefined })).toBe('maxResults=500')
  })

  it('encodes search queries', () => {
    expect(buildQuery({ q: 'newer_than:1y category:promotions' })).toBe(
      'q=newer_than%3A1y+category%3Apromotions',
    )
  })
})
