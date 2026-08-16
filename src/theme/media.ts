const QUERY = '(prefers-color-scheme: dark)'

function query(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia(QUERY)
}

export function prefersDarkNow(): boolean {
  return query()?.matches ?? false
}

/**
 * Shaped for useSyncExternalStore, which is how React wants external state read.
 *
 * The media query is the real signal, but the panel is often hidden when the
 * browser theme changes and a missed event would leave it stale until reload.
 * Re-reading when the panel becomes visible again costs nothing and closes that
 * gap.
 */
export function subscribeToColorScheme(onChange: () => void): () => void {
  const list = query()
  const teardown: (() => void)[] = []

  if (list) {
    list.addEventListener('change', onChange)
    teardown.push(() => {
      list.removeEventListener('change', onChange)
    })
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onChange)
    teardown.push(() => {
      document.removeEventListener('visibilitychange', onChange)
    })
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', onChange)
    teardown.push(() => {
      window.removeEventListener('focus', onChange)
    })
  }

  return () => {
    for (const off of teardown) off()
  }
}
