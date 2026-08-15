import { createContext, useContext } from 'react'
import type { MessageParams } from './format'
import type { Locale } from './locale'
import type { MessageKey } from './locales/en'

export type Translate = (key: MessageKey, params?: MessageParams) => string

export type I18nValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translate
}

export const I18nContext = createContext<I18nValue | null>(null)

function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside I18nProvider')
  return value
}

export function useT(): Translate {
  return useI18n().t
}

export function useLocale(): Pick<I18nValue, 'locale' | 'setLocale'> {
  const { locale, setLocale } = useI18n()
  return { locale, setLocale }
}
