const STORAGE_KEY = 'locale'

// The extension APIs are absent when the panel is served by the dev server, so
// every access is guarded rather than assumed.
function hasStorage(): boolean {
  return typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined'
}

export function browserLanguage(): string | undefined {
  if (typeof chrome !== 'undefined' && typeof chrome.i18n !== 'undefined') {
    return chrome.i18n.getUILanguage()
  }
  return typeof navigator === 'undefined' ? undefined : navigator.language
}

export async function readStoredLocale(): Promise<string | null> {
  if (!hasStorage()) return null

  const stored = await chrome.storage.local.get(STORAGE_KEY)
  const value: unknown = stored[STORAGE_KEY]
  return typeof value === 'string' ? value : null
}

export async function writeStoredLocale(locale: string): Promise<void> {
  if (!hasStorage()) return
  await chrome.storage.local.set({ [STORAGE_KEY]: locale })
}
