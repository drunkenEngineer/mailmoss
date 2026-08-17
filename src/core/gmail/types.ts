export type GmailProfile = {
  emailAddress: string
  messagesTotal: number
  threadsTotal: number
  historyId: string
}

export type GmailMessageRef = {
  id: string
  threadId: string
}

export type GmailMessageList = {
  messages?: GmailMessageRef[]
  nextPageToken?: string
  resultSizeEstimate: number
}

export type GmailHeader = {
  name: string
  value: string
}

export type GmailHistoryMessage = {
  id: string
  threadId: string
  labelIds?: string[]
}

export type GmailHistoryRecord = {
  id: string
  messagesAdded?: { message: GmailHistoryMessage }[]
}

export type GmailHistoryList = {
  history?: GmailHistoryRecord[]
  nextPageToken?: string
  /** The mailbox's current history id, whether or not anything changed. */
  historyId: string
}

export type GmailMessageMetadata = {
  id: string
  threadId: string
  labelIds?: string[]
  internalDate: string
  payload?: {
    headers?: GmailHeader[]
  }
}
