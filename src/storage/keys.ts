/** Every key written to chrome.storage.local is declared here, so what the extension persists can be read off in one place. */
export const STORAGE_KEYS = {
  /** UI preference, deliberately independent of scan data so wiping a scan does not reset the language. */
  locale: 'locale',
  /** UI preference: system, light or dark. */
  theme: 'theme',
  /**
   * Scans are stored one per account, under `scan:<accountHash>`. A single
   * shared slot meant connecting a second account destroyed the first one's
   * results, which is silent data loss rather than an unsupported feature.
   */
  scanPrefix: 'scan:',
  /** The single-slot layout this replaced. Read once, to migrate, then removed. */
  legacyScan: 'scan',
} as const

export function scanKey(accountHash: string): string {
  return `${STORAGE_KEYS.scanPrefix}${accountHash}`
}

export function isScanKey(key: string): boolean {
  return key.startsWith(STORAGE_KEYS.scanPrefix)
}
