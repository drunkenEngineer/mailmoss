import { en } from './locales/en'
import { fr } from './locales/fr'
import type { Messages } from './locales/en'

export const LOCALES = ['en', 'fr'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const catalogues: Record<Locale, Messages> = { en, fr }

export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
}

export function isLocale(value: string | undefined | null): value is Locale {
  return LOCALES.includes(value as Locale)
}

// A stored choice wins over the browser language. Region subtags are dropped:
// fr-CA and fr-FR both resolve to fr.
export function resolveLocale(uiLanguage?: string | null, stored?: string | null): Locale {
  if (isLocale(stored)) return stored

  const base = uiLanguage?.toLowerCase().split('-')[0]
  return isLocale(base) ? base : DEFAULT_LOCALE
}
