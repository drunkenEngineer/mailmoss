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

export type GmailMessageMetadata = {
  id: string
  threadId: string
  labelIds?: string[]
  internalDate: string
  payload?: {
    headers?: GmailHeader[]
  }
}
