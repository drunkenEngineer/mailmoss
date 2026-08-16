/**
 * The slice of chrome.storage.local this project uses. Declaring it as an
 * interface keeps the store testable in plain Node and makes the surface
 * explicit.
 */
export type StorageArea = {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
  remove(keys: string | string[]): Promise<void>
  getBytesInUse?(keys: string | string[] | null): Promise<number>
}

export function chromeLocalArea(): StorageArea {
  return {
    get: (keys) => chrome.storage.local.get(keys),
    set: (items) => chrome.storage.local.set(items),
    remove: (keys) => chrome.storage.local.remove(keys),
    getBytesInUse: (keys) => chrome.storage.local.getBytesInUse(keys),
  }
}

export function hasStorage(): boolean {
  return typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined'
}
