export const GMAIL_METADATA_SCOPE = 'https://www.googleapis.com/auth/gmail.metadata'

export const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'

// Metadata only by default: it returns headers and labels but never message
// bodies, which is the claim the product is built on. Readonly is requested
// separately, per sender, and only when a sender publishes no unsubscribe
// header at all.
export const DEFAULT_SCOPES = [GMAIL_METADATA_SCOPE]
