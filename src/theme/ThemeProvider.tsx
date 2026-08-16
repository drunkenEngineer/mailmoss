import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { ThemeContext } from './context'
import type { ThemeValue } from './context'
import { prefersDarkNow, subscribeToColorScheme } from './media'
import { applyTheme, resolveTheme } from './theme'
import type { ThemeChoice } from './theme'
import { readStoredTheme, writeStoredTheme } from './preference'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>('system')

  // The browser preference is external state that can change while the panel is
  // open, which is exactly what useSyncExternalStore is for.
  const prefersDark = useSyncExternalStore(subscribeToColorScheme, prefersDarkNow, () => false)
  const resolved = resolveTheme(choice, prefersDark)

  useEffect(() => {
    readStoredTheme()
      .then((stored) => {
        if (stored) setChoiceState(stored)
      })
      .catch((error: unknown) => {
        console.error('Failed to read the stored theme', error)
      })
  }, [])

  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next)
    writeStoredTheme(next).catch((error: unknown) => {
      console.error('Failed to persist the theme', error)
    })
  }, [])

  const value = useMemo<ThemeValue>(
    () => ({ choice, resolved, setChoice }),
    [choice, resolved, setChoice],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
