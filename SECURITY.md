# Security

## Reporting a vulnerability

Report privately through GitHub's [security advisory](https://github.com/drunkenEngineer/quietinbox/security/advisories/new)
form rather than opening a public issue. Expect a first reply within a few days.

Findings that matter most here:

- Anything that causes mail data to leave the browser other than to the Gmail API.
- Anything that widens the granted OAuth scope without the user acting.
- Anything that lets a page outside the extension read stored data or the access token.
- An unsubscribe request firing without the user having confirmed it.

## Design constraints

These hold for every release, and a change that breaks one is a bug regardless of what it enables:

- No backend. There is no server operated by this project.
- Only per-sender aggregates are persisted. Subjects, bodies and individual message identifiers
  are not written to storage.
- The stored account identifier is a SHA-256 hash, not the address.
- The access token is held by Chrome through `chrome.identity` and is not persisted by the
  extension.
- Broad host permissions are optional and requested at the moment they are needed, never at
  install time.

## Scope

The extension is in early development and has not yet been through Google's OAuth verification.
Until it has, treat published builds as pre-release.
