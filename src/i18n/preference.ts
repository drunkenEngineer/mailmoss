import { hasStorage } from '../storage/area'
import { STORAGE_KEYS } from '../storage/keys'

const STORAGE_KEY = STORAGE_KEYS.locale

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
