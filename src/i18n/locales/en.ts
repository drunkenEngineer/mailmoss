export const en = {
  appName: 'Mailmoss',
  tagline: 'Senders you never read',
  languageLabel: 'Language',

  connectIntro:
    'Mailmoss reads message headers to work out which senders you ignore. It asks for header access only, so it cannot open your emails.',
  connectPrivacy: 'Nothing is sent anywhere but Google. Everything is worked out in this browser.',
  connect: 'Connect Gmail',
  connecting: 'Connecting…',

  signedInAs: 'Signed in as {email}',
  messagesTotal: '{count} messages in this account',
  grantedScopes: 'Granted: {scopes}',

  scanStart: 'Scan my inbox',
  scanAgain: 'Scan again',
  scanning: 'Scanning',
  scanCancel: 'Cancel',
  scanResume: 'Resume',
  scanProgress: '{processed} messages · {senders} senders',
  scanRate: '{rate} per second',
  scanCategory: 'Reading {label}',
  scanRestored: 'Picked up a saved scan from before.',
  scanCancelled: 'Cancelled. Resume continues where it stopped.',
  scanFinished: 'Scanned {processed} messages and found {senders} senders.',
  scanCapped: 'Stopped at the safety limit of {processed} messages.',
  scanOrderWarning:
    'Gmail returned messages out of order, so the one-year limit could not be applied. The scan covered everything instead, which took longer.',

  resultsEmpty: 'No senders yet. Run a scan to see who you never read.',
  resultsNoMatches: 'No senders match this filter.',
  resultsClearFilters: 'Clear filters',
  resultsCount: '{count} senders',
  resultsHandled: '{count} handled',

  filterAll: 'All',
  filterNeverOpened: 'Never opened',
  filterMostlyUnread: 'Over 80% unread',
  filterDormant: 'Quiet 6 months',

  sortLabel: 'Sort',
  sortIgnored: 'Most ignored',
  sortVolume: 'Most messages',
  sortRecent: 'Most recent',

  searchPlaceholder: 'Search sender or domain',

  rowUnread: '{percent}% unread',
  rowMessages: '{count} messages',
  rowEngaged: 'You have starred or replied to this one',

  methodOneClick: 'One click',
  methodLink: 'Link',
  methodEmail: 'Email',
  methodNone: 'No link',

  selectionCount: '{count} selected',
  selectionAll: 'Select all',
  selectionClear: 'Clear',
  selectionUnsubscribe: 'Unsubscribe',
  selectionIgnore: 'Ignore',
  selectionLarge: "That's {count} senders at once. Check the list before going ahead.",
  unsubscribeNotReady: 'Unsubscribing arrives in the next step.',

  settings: 'Settings',
  settingsScope: 'Access granted: {scopes}',
  settingsFullScan: 'Go back further than a year',
  settingsFullScanNote:
    'Slower, and rarely changes the ranking. Newsletters and notifications are covered either way.',
  settingsShowHandled: 'Show senders already handled',
  settingsDiagnostics: 'Developer diagnostics',
  settingsWipe: 'Revoke access and wipe local data',
  settingsWipeNote: 'Removes the access grant and deletes everything stored in this browser.',
  settingsStorage: 'Stored locally: {size}',

  errorTitle: 'Something went wrong',
  errorAuth: 'The connection expired. Connect again to carry on.',
  errorNetwork: 'Could not reach Gmail. Check your connection.',
  errorRate: 'Gmail is rate limiting. Waiting a moment usually clears it.',
  retry: 'Try again',
  back: 'Back',
} as const

export type MessageKey = keyof typeof en
export type Messages = Record<MessageKey, string>
