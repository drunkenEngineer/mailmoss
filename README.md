# Mailmoss

A Chrome extension that shows which Gmail senders you never read, and lets you unsubscribe from
them in bulk. Available in English and French.

There is no backend. Your mail is fetched from Google's API straight into your browser, analysed
there, and never sent anywhere else. The whole point of the project is that you can check that
claim by reading the source rather than trusting a privacy policy.

**Status: early development.** Nothing here is usable yet. See [CHANGELOG.md](CHANGELOG.md).

## How it works

The extension groups your mail by sender and ranks senders by how consistently you ignore them.
For each one it can then use the standard unsubscribe mechanism that most bulk senders already
support ([RFC 8058](https://www.rfc-editor.org/rfc/rfc8058)), falling back to opening the
unsubscribe page in a tab when they do not.

Two deliberate choices shape the design:

**Only headers are read.** The default OAuth scope is `gmail.metadata`, which returns headers and
labels but never message bodies. Reading a body is a separate, optional permission you grant per
sender, only when a sender publishes no unsubscribe header at all.

**Only aggregates are stored.** What lands in `chrome.storage.local` is a count per sender.
No subjects, no bodies, no message identifiers, and the account is identified by a hash rather
than by your address.

## What leaves your machine

Being precise about this matters more than sounding absolute:

- Requests to Google's Gmail API, authenticated with your own OAuth token.
- When you unsubscribe, one HTTP request to the sender's own unsubscribe endpoint. That request
  is the unsubscribe.

That is the complete list. No analytics, no crash reporting, no telemetry.

## Languages

The interface follows your browser language and falls back to English. You can override it from
the picker in the panel, and the choice sticks.

## Not planned

- Deleting or archiving mail (the extension does not ask for write access).
- Providers other than Gmail.
- Accounts, sync, or any hosted component.
- Automatic unsubscribing without a confirmation step.

## Local setup

Node 22 or later.

```
npm install
cp .env.example .env
npm run build
```

Load `dist/` at `chrome://extensions` with developer mode on. Gmail access needs your own Google
Cloud project and an OAuth client of type "Chrome Extension"; both values go in `.env`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

## Scripts

| Command          | Purpose                              |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Dev server with extension hot reload |
| `npm run build`  | Production build into `dist/`        |
| `npm run verify` | Lint, type check, test and build     |

## Licence

MIT
