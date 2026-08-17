export const en = {
  appName: 'Mailmoss',
  tagline: 'Senders you never read',
  languageLabel: 'Language',

  connectIntro:
    'Mailmoss reads message headers to work out which senders you ignore. It asks for header access only, so it cannot open your emails.',
  connectPrivacy: 'Nothing is sent anywhere but Google. Everything is worked out in this browser.',
  connect: 'Connect Gmail',
  connecting: 'Connecting…',
  connectOther: 'Use a different account',
  switchAccount: 'Switch account',
  switchAccountNote:
    'Connects a different Gmail account. The current scan is kept separately and is not mixed in.',

  scanStart: 'Scan my inbox',
  scanAgain: 'Scan again',
  scanning: 'Scanning',
  scanCancel: 'Cancel',
  scanResume: 'Resume',
  scanProgress: '{processed} messages · {senders} senders',
  scanRate: '{rate} per second',
  scanCategory: 'Reading {label}',
  scanRefresh: 'Check for new',
  scanRefreshing: 'Checking…',
  refreshUpdated: 'Added {count} new messages.',
  refreshUpToDate: 'Nothing new since the last scan.',
  refreshBaseline:
    'This scan predates change tracking, so there was nothing to compare against. Tracking starts from now — check again later to see what arrives.',
  refreshTooOld:
    'Too long since the last scan for a quick check. Gmail only keeps about a week of history, so run a full scan to catch up.',
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

  settings: 'Settings',
  settingsScope: 'Access granted: {scopes}',
  settingsFullScan: 'Go back further than a year',
  settingsFullScanNote:
    'Slower, and rarely changes the ranking. Newsletters and notifications are covered either way.',
  settingsShowHandled: 'Show senders already handled',
  settingsWipe: 'Revoke access and wipe local data',
  settingsWipeNote: 'Removes the access grant and deletes everything stored in this browser.',
  settingsStorage: 'Stored locally: {size}',

  confirmTitle: 'Unsubscribe from {count} senders',
  confirmIntro:
    'Every address below will be unsubscribed. Senders that support one click are done straight away; the rest open in a tab for you to finish.',
  confirmMethodSummary: '{oneClick} in one click · {manual} need a tab',
  confirmCancel: 'Back',
  confirmGo: 'Unsubscribe',

  hostAccessTitle: 'One extra permission',
  hostAccessExplain:
    'Sending the one-click request needs permission to reach the senders’ own servers. Mailmoss asks for it now rather than at install, and only uses it when you unsubscribe. Refusing still works: those senders open in a tab instead.',

  runProgress: 'Unsubscribing {index} of {total}',
  runCancel: 'Stop',

  reportTitle: 'Done',
  reportDone: '{count} unsubscribed',
  reportManual: '{count} opened in a tab for you to finish',
  reportFailed: '{count} failed',
  reportCancelled: 'Stopped early. Senders not reached were left alone.',
  reportRetry: 'Retry the failures',
  reportClose: 'Close',

  statusDone: 'Unsubscribed',
  statusManual: 'Needs your confirmation',
  statusFailed: 'Failed',

  themeLabel: 'Theme',
  themeSystem: 'Match browser',
  themeLight: 'Light',
  themeDark: 'Dark',

  errorTitle: 'Something went wrong',
  errorSignInTimeout:
    'Sign-in did not finish. Check for a Google window behind this one — it usually explains why. If it says the app is not verified, choose Advanced and continue. If it says access denied, this account has not been added as a tester.',
  errorAuth: 'The connection expired. Connect again to carry on.',
  errorNetwork: 'Could not reach Gmail. Check your connection.',
  errorRate: 'Gmail is rate limiting. Waiting a moment usually clears it.',
  retry: 'Try again',
} as const

export type MessageKey = keyof typeof en
export type Messages = Record<MessageKey, string>
