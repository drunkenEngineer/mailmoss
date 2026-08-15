import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, LOCALES, catalogues, resolveLocale } from '@/i18n/locale'
import { en } from '@/i18n/locales/en'

describe('resolveLocale', () => {
  it('falls back to the default when nothing is known', () => {
    expect(resolveLocale(undefined, undefined)).toBe(DEFAULT_LOCALE)
  })

  it('ignores the region subtag', () => {
    expect(resolveLocale('fr-CA')).toBe('fr')
    expect(resolveLocale('en-GB')).toBe('en')
  })

  it('is case insensitive', () => {
    expect(resolveLocale('FR')).toBe('fr')
  })

  it('falls back for an unsupported language', () => {
    expect(resolveLocale('de-DE')).toBe(DEFAULT_LOCALE)
  })

  it('prefers a stored choice over the browser language', () => {
    expect(resolveLocale('en-US', 'fr')).toBe('fr')
  })

  it('ignores a stored value that is not a supported locale', () => {
    expect(resolveLocale('fr-FR', 'es')).toBe('fr')
  })
})

describe('catalogues', () => {
  const keys = Object.keys(en)

  it.each(LOCALES)('%s defines every message key', (locale) => {
    expect(Object.keys(catalogues[locale]).sort()).toEqual([...keys].sort())
  })

  it.each(LOCALES)('%s has no empty message', (locale) => {
    for (const [key, value] of Object.entries(catalogues[locale])) {
      expect(value.trim(), `${locale}.${key}`).not.toBe('')
    }
  })
})
