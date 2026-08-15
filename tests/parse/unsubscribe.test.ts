import { describe, expect, it } from 'vitest'
import { hasOneClick, parseListUnsubscribe, resolveUnsubscribe } from '@/core/parse/unsubscribe'

describe('parseListUnsubscribe', () => {
  it('splits bracketed values by kind', () => {
    expect(parseListUnsubscribe('<https://a.fr/u?x=1>, <mailto:stop@a.fr>')).toEqual({
      https: ['https://a.fr/u?x=1'],
      mailto: ['mailto:stop@a.fr'],
    })
  })

  it('survives header folding across lines', () => {
    expect(parseListUnsubscribe('<https://a.fr/u>,\r\n <mailto:stop@a.fr>').https).toEqual([
      'https://a.fr/u',
    ])
  })

  it('falls back to comma splitting when brackets are missing', () => {
    expect(parseListUnsubscribe('https://a.fr/u, mailto:stop@a.fr')).toEqual({
      https: ['https://a.fr/u'],
      mailto: ['mailto:stop@a.fr'],
    })
  })

  it('ignores plain http and other schemes', () => {
    expect(parseListUnsubscribe('<http://a.fr/u>, <ftp://a.fr>')).toEqual({
      https: [],
      mailto: [],
    })
  })

  it('returns empty for a missing header', () => {
    expect(parseListUnsubscribe(undefined)).toEqual({ https: [], mailto: [] })
  })
})

describe('hasOneClick', () => {
  it('accepts the RFC 8058 value in any spacing or case', () => {
    expect(hasOneClick('List-Unsubscribe=One-Click')).toBe(true)
    expect(hasOneClick('list-unsubscribe = one-click')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(hasOneClick(undefined)).toBe(false)
    expect(hasOneClick('')).toBe(false)
    expect(hasOneClick('List-Archive=something')).toBe(false)
  })
})

describe('resolveUnsubscribe', () => {
  it('claims one-click only when both the header and an https target exist', () => {
    expect(resolveUnsubscribe('<https://a.fr/u>', 'List-Unsubscribe=One-Click')).toEqual({
      method: 'one-click',
      target: 'https://a.fr/u',
    })
  })

  it('degrades to a link when one-click is not advertised', () => {
    expect(resolveUnsubscribe('<https://a.fr/u>', undefined).method).toBe('http')
  })

  it('never claims one-click for a mailto, even if the header says so', () => {
    expect(resolveUnsubscribe('<mailto:stop@a.fr>', 'List-Unsubscribe=One-Click')).toEqual({
      method: 'mailto',
      target: 'mailto:stop@a.fr',
    })
  })

  it('prefers https when both are offered', () => {
    expect(resolveUnsubscribe('<mailto:stop@a.fr>, <https://a.fr/u>', undefined)).toEqual({
      method: 'http',
      target: 'https://a.fr/u',
    })
  })

  it('reports none when there is no header', () => {
    expect(resolveUnsubscribe(undefined, undefined)).toEqual({ method: 'none' })
  })
})
