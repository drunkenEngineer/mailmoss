import { hasStorage } from '../storage/area'
import { STORAGE_KEYS } from '../storage/keys'
import { isThemeChoice } from './theme'
import type { ThemeChoice } from './theme'

export async function readStoredTheme(): Promise<ThemeChoice | null> {
  if (!hasStorage()) return null

  const stored = await chrome.storage.local.get(STORAGE_KEYS.theme)
  const value: unknown = stored[STORAGE_KEYS.theme]
  return isThemeChoice(value) ? value : null
}

export async function writeStoredTheme(choice: ThemeChoice): Promise<void> {
  if (!hasStorage()) return
  await chrome.storage.local.set({ [STORAGE_KEYS.theme]: choice })
}
