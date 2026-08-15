import { describe, expect, it } from 'vitest'
import { domainOf, parseFrom, senderKey } from '@/core/parse/address'

describe('parseFrom', () => {
  it('reads a name and an address', () => {
    expect(parseFrom('Le Monde <newsletter@lemonde.fr>')).toEqual({
      displayName: 'Le Monde',
      address: 'newsletter@lemonde.fr',
      domain: 'lemonde.fr',
    })
  })

  it('reads a bare address', () => {
    expect(parseFrom('newsletter@lemonde.fr')?.address).toBe('newsletter@lemonde.fr')
  })

  it('reads an address in brackets with no name', () => {
    expect(parseFrom('<newsletter@lemonde.fr>')).toEqual({
      displayName: '',
      address: 'newsletter@lemonde.fr',
      domain: 'lemonde.fr',
    })
  })

  it('unquotes a name containing a comma', () => {
    expect(parseFrom('"Monde, Le" <a@b.fr>')?.displayName).toBe('Monde, Le')
  })

  it('unescapes an escaped quote inside a quoted name', () => {
    expect(parseFrom('"The \\"Daily\\"" <a@b.fr>')?.displayName).toBe('The "Daily"')
  })

  it('decodes an encoded name', () => {
    expect(parseFrom('=?UTF-8?Q?Caf=C3=A9_du_Coin?= <hello@cafe.fr>')).toEqual({
      displayName: 'Café du Coin',
      address: 'hello@cafe.fr',
      domain: 'cafe.fr',
    })
  })

  it('lowercases the address but leaves the name alone', () => {
    const parsed = parseFrom('NewsRoom <NewsLetter@LeMonde.FR>')
    expect(parsed?.address).toBe('newsletter@lemonde.fr')
    expect(parsed?.displayName).toBe('NewsRoom')
  })

  it('rejects anything without a usable address', () => {
    expect(parseFrom('')).toBeNull()
    expect(parseFrom(undefined)).toBeNull()
    expect(parseFrom('not an address')).toBeNull()
    expect(parseFrom('@nolocalpart.fr')).toBeNull()
    expect(parseFrom('nodomain@')).toBeNull()
  })
})

describe('senderKey', () => {
  it('normalises case and surrounding space', () => {
    expect(senderKey('  News@Example.COM ')).toBe('news@example.com')
  })

  it('keeps sub-addressing, since it distinguishes senders', () => {
    expect(senderKey('news+promo@example.com')).toBe('news+promo@example.com')
    expect(senderKey('news+promo@example.com')).not.toBe(senderKey('news@example.com'))
  })
})

describe('domainOf', () => {
  it('takes everything after the last at sign', () => {
    expect(domainOf('news@example.com')).toBe('example.com')
    expect(domainOf('odd@name@example.com')).toBe('example.com')
    expect(domainOf('broken')).toBe('')
  })
})
