// Requested at the moment of the first one-click unsubscribe, never at install
// time. Declaring these up front is a Web Store review risk and contradicts the
// product's own pitch.
export const BROAD_ORIGINS = ['*://*/*']

export async function hasBroadHostAccess(): Promise<boolean> {
  return chrome.permissions.contains({ origins: BROAD_ORIGINS })
}

/** Must be called from a user gesture or Chrome rejects it outright. */
export async function requestBroadHostAccess(): Promise<boolean> {
  return chrome.permissions.request({ origins: BROAD_ORIGINS })
}

export async function dropBroadHostAccess(): Promise<boolean> {
  return chrome.permissions.remove({ origins: BROAD_ORIGINS })
}
