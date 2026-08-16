/** Every key written to chrome.storage.local is declared here, so what the extension persists can be read off in one place. */
export const STORAGE_KEYS = {
  /** UI preference, deliberately independent of the scan document so wiping a scan does not reset the language. */
  locale: 'locale',
  /** The scan document: per-sender aggregates plus resume state. */
  scan: 'scan',
} as const
