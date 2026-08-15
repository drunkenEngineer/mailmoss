export const en = {
  appName: 'Mailmoss',
  tagline: 'Senders you never read',
  notConnected: 'Not connected yet.',
  languageLabel: 'Language',
} as const

export type MessageKey = keyof typeof en
export type Messages = Record<MessageKey, string>
