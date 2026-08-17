# Privacy Policy

**Mailmoss** · last updated 17 August 2026

## The short version

Mailmoss has no server. There is no account to create, nothing is uploaded, and the developer
cannot see your mail, your senders, or the fact that you use the extension at all.

## What Mailmoss reads

With your permission, Mailmoss calls Google's Gmail API directly from your browser using the
`gmail.metadata` scope. That scope returns message **headers and labels only** — sender, date,
unsubscribe headers, and whether a message is unread. It does not return message bodies. This is
not a promise to avoid reading them; the access granted makes it impossible.

A second scope, `gmail.readonly`, may be offered later for the narrow case of a sender that
publishes no unsubscribe header, where the link exists only in the message body. It is never
requested automatically, and refusing it leaves everything else working.

## What Mailmoss stores, and where

Everything is stored by your browser, on your computer, in `chrome.storage.local`. Specifically:

- One row per sender: address, display name, domain, message counts, first and last seen dates,
  the detected unsubscribe method, and whether you have handled it.
- A marker used to fetch only new mail on later runs.
- Your language and theme preference.

Deliberately **not** stored: message subjects, message bodies, individual message identifiers, or
your email address. The account is identified by a SHA-256 hash so a saved analysis can be told
apart from another account's without keeping the address itself.

Browser storage is not encrypted. That is a reason the stored data is kept to per-sender totals
rather than anything resembling your mail.

## What leaves your computer

Two things, both necessary, both visible in the source:

1. **Requests to Google's Gmail API**, authenticated with your own OAuth token. Google's handling
   of these is governed by [Google's Privacy Policy](https://policies.google.com/privacy).
2. **When you unsubscribe, one HTTP request to that sender's own unsubscribe endpoint.** That
   request _is_ the unsubscribe. It is only sent for senders you selected and confirmed.

That is the complete list. There is no analytics, no crash reporting, no telemetry, no error
tracking, and no third-party service of any kind.

## Permissions, and why each exists

| Permission                                      | Why                                                                                                                                                                                       |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identity`                                      | Sign in to Google and obtain a token for the Gmail API                                                                                                                                    |
| `storage`                                       | Keep the analysis and your preferences on your computer                                                                                                                                   |
| `sidePanel`                                     | The interface is a side panel                                                                                                                                                             |
| `tabs`                                          | Open an unsubscribe page when a sender offers no one-click option                                                                                                                         |
| `gmail.googleapis.com`, `oauth2.googleapis.com` | Reach the Gmail API and revoke access                                                                                                                                                     |
| Broad host access (optional)                    | Send the one-click unsubscribe request to a sender's own server. Requested at the moment you first unsubscribe, never at install, and refusing it falls back to opening the page in a tab |

## Sharing

Nothing is shared, sold, transferred, or disclosed, because nothing is collected. There is no
recipient to share with.

Mailmoss's use of information received from Google APIs adheres to the
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
including the Limited Use requirements. Data obtained through those APIs is used solely to show
you which senders you ignore and to unsubscribe at your request. It is never transferred to
anyone, never used for advertising, and never read by a human.

## Removing your data

**Settings → Revoke access and wipe local data** withdraws the grant with Google and deletes
everything Mailmoss has stored in your browser, for every account you connected. Uninstalling the
extension also removes its storage. There is nothing held elsewhere that could survive either.

You can independently review or revoke access at
[Google Account permissions](https://myaccount.google.com/permissions).

## Children

Mailmoss is not directed at children under 13 and collects nothing from anyone.

## Changes

Changes to this policy are committed to the public repository, so the full history of what this
document has ever said is visible alongside the code it describes.

## Contact

Open an issue at [github.com/drunkenEngineer/mailmoss](https://github.com/drunkenEngineer/mailmoss/issues),
or use the private [security advisory](https://github.com/drunkenEngineer/mailmoss/security/advisories/new)
form for anything sensitive.
