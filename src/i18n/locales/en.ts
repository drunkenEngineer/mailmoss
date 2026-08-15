export const en = {
  appName: 'Mailmoss',
  tagline: 'Senders you never read',
  languageLabel: 'Language',

  notConnected: 'Not connected yet.',
  connectIntro:
    'Mailmoss reads message headers to work out which senders you ignore. It asks for header access only, so it cannot open your emails.',
  connect: 'Connect Gmail',
  connecting: 'Connecting…',
  revoke: 'Revoke access',
  revoking: 'Revoking…',
  signedInAs: 'Signed in as {email}',
  messagesTotal: '{count} messages in this account',
  grantedScopes: 'Granted: {scopes}',

  probeTitle: 'Scope probe',
  probeIntro:
    'Checks what the header-only scope actually allows. The result decides how scanning works.',
  probeRun: 'Run probe',
  probeRunning: 'Running…',
  probeVerdict: 'Verdict',

  errorTitle: 'Something went wrong',
  retry: 'Try again',
} as const

export type MessageKey = keyof typeof en
export type Messages = Record<MessageKey, string>
