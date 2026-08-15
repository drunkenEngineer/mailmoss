import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { I18nContext } from './context'
import type { I18nValue } from './context'
import { format } from './format'
import { catalogues, resolveLocale } from './locale'
import type { Locale } from './locale'
import { browserLanguage, readStoredLocale, writeStoredLocale } from './preference'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => resolveLocale(browserLanguage()))

  useEffect(() => {
    let active = true

    readStoredLocale()
      .then((stored) => {
        if (active) setLocaleState(resolveLocale(browserLanguage(), stored))
      })
      .catch((error: unknown) => {
        console.error('Failed to read the stored locale', error)
      })

    return () => {
      active = false
    }
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    writeStoredLocale(next).catch((error: unknown) => {
      console.error('Failed to persist the locale', error)
    })
  }, [])

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => format(catalogues[locale][key], params),
    }),
    [locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
