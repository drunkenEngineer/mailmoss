import { describe, expect, it } from 'vitest'
import { decodeEncodedWords } from '@/core/parse/encodedWord'

describe('decodeEncodedWords', () => {
  it('leaves plain ASCII untouched', () => {
    expect(decodeEncodedWords('Le Monde')).toBe('Le Monde')
  })

  it('decodes base64 UTF-8', () => {
    expect(decodeEncodedWords('=?UTF-8?B?TMOpZ2VuZGU=?=')).toBe('Légende')
  })

  it('decodes quoted-printable, treating underscore as space', () => {
    expect(decodeEncodedWords('=?UTF-8?Q?Caf=C3=A9_du_Coin?=')).toBe('Café du Coin')
  })

  it('is case insensitive about the encoding letter', () => {
    expect(decodeEncodedWords('=?utf-8?b?w6k=?=')).toBe('é')
    expect(decodeEncodedWords('=?utf-8?q?=C3=A9?=')).toBe('é')
  })

  it('drops the whitespace separating adjacent encoded words', () => {
    expect(decodeEncodedWords('=?UTF-8?Q?Caf=C3=A9?= =?UTF-8?Q?_Noir?=')).toBe('Café Noir')
  })

  it('keeps whitespace between an encoded word and plain text', () => {
    expect(decodeEncodedWords('=?UTF-8?Q?Caf=C3=A9?= Noir')).toBe('Café Noir')
  })

  it('handles latin-1', () => {
    expect(decodeEncodedWords('=?ISO-8859-1?Q?Caf=E9?=')).toBe('Café')
  })

  it('strips an RFC 2231 language tag from the charset', () => {
    expect(decodeEncodedWords('=?UTF-8*fr?B?TMOpZ2VuZGU=?=')).toBe('Légende')
  })

  it('falls back to utf-8 for an unknown charset', () => {
    expect(decodeEncodedWords('=?NOT-A-CHARSET?B?TMOpZ2VuZGU=?=')).toBe('Légende')
  })

  it('leaves malformed base64 in place rather than throwing', () => {
    expect(() => decodeEncodedWords('=?UTF-8?B?!!!!?=')).not.toThrow()
  })
})
