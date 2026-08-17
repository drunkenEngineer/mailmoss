# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-08-17

First tagged build. The extension works end to end but has not been through Google's OAuth
verification, so it is installed from source rather than the Web Store.

### Added

- **Sender analysis.** Scans Gmail by category, newest first, stopping at a one-year window, and
  ranks senders by how consistently they are ignored. Scans are resumable and survive closing the
  panel.
- **Unsubscribing.** One-click ([RFC 8058](https://www.rfc-editor.org/rfc/rfc8058)) where a sender
  supports it, falling back to opening the unsubscribe page, a pre-filled email, or a Gmail search
  by sender. Bulk runs are sequential, cancellable, and report per sender.
- **Check for new.** Later runs fetch only what arrived since the last scan.
- **Account switching**, through Google's own account picker, since Chrome's built-in sign-in
  offers none. Each account keeps its own analysis.
- **Interface** in English and French, light and dark, following the browser with a manual
  override. Filters, search, three sort orders, and multi-select.
- **Revoke access and wipe local data**, which withdraws the grant and deletes everything stored,
  for every account.

### Notes on what it deliberately does not do

- Asks for `gmail.metadata` by default, which cannot return message bodies.
- Stores per-sender totals only. No subjects, no bodies, no message identifiers, and the account
  is a hash rather than an address.
- No analytics, crash reporting or telemetry. An end-to-end test asserts that nothing is requested
  from outside Google before sign-in.
- Reports unread rate rather than an open rate, because the Gmail API exposes no read history and
  an open rate would be a number it cannot compute.

### Known limits

- Google's OAuth consent screen is in testing, so access is limited to approved test users until
  verification completes.
- The account picker uses the implicit grant, so its tokens last about an hour with no silent
  refresh. Default sign-in is unaffected.
- End-to-end coverage stops at the sign-in button; the Gmail API is not mocked, so the scan and
  unsubscribe paths are unit tested only.
- TypeScript is held at 6.x. 7 builds correctly but `typescript-eslint` does not support it yet,
  and losing type-aware linting costs more than the upgrade gains.
