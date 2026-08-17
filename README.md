# Mailmoss

Find the Gmail senders you never read, and unsubscribe from them in bulk.

There is no server. Your mail is fetched from Google's API straight into your browser, analysed
there, and never sent anywhere else. That is checkable rather than promised: the whole thing is
about 3,400 lines you can read in an afternoon.

**Status: pre-release.** It works end to end, and has not yet been through Google's OAuth
verification, so for now it is installed from source.

---

## The part that matters

Unroll.me was caught in 2017 selling its users' email data to Uber through its parent company.
Every tool in this category asks for access to your inbox, and most of them route it through a
server you cannot inspect.

Mailmoss asks for the **`gmail.metadata`** scope, which returns headers and labels and **cannot
return message bodies**. Not "does not" — _cannot_. Google will not serve them to a token with
that scope. The unsubscribe mechanism works entirely off the `List-Unsubscribe` headers, so
nothing is given up by asking for less.

What reaches your disk is a row per sender: an address, some counts, a couple of dates. No
subjects, no bodies, no message identifiers, and the account is stored as a hash rather than your
address.

## What leaves your machine

Being exact about this matters more than sounding absolute:

- Requests to Google's Gmail API, authenticated with your own OAuth token.
- When you unsubscribe, one HTTP request to that sender's own unsubscribe endpoint. That request
  **is** the unsubscribe.

That is the entire list. No analytics, no crash reporting, no telemetry. There is an
[end-to-end test](e2e/panel.spec.ts) asserting that nothing is requested from outside Google
before sign-in, so the claim is enforced rather than merely stated.

## How it decides what you ignore

The Gmail API exposes **no read history** — no open timestamps, no record of a message read and
later marked unread. Any tool showing you an "open rate" is showing a number it cannot compute.

So Mailmoss reports **unread rate**, from labels Gmail actually exposes, and says "92% unread"
rather than "8% open rate". Senders you have starred or replied to are ranked down rather than
hidden, because hiding them would leave you hunting for a sender the tool quietly decided not to
show.

## Unsubscribing

Four routes, tried in order:

| Sender offers                                                  | What happens                                   |
| -------------------------------------------------------------- | ---------------------------------------------- |
| One-click ([RFC 8058](https://www.rfc-editor.org/rfc/rfc8058)) | A single POST, done immediately                |
| An unsubscribe link                                            | Opens in a tab for you to finish               |
| A `mailto:` address                                            | Opens a pre-filled Gmail draft for you to send |
| Nothing at all                                                 | Opens a Gmail search for that sender           |

A silent request is only ever sent to a sender that **declared** it supports one. A plain link is
never POSTed to, even when the permission to do so has been granted.

Only a confirmed one-click marks a sender as unsubscribed. Opening a page leaves it pending,
because you still have to finish, and the list should not tell you otherwise.

Broad host access is requested at the moment you first unsubscribe, never at install. Refusing it
is a supported path: those senders open in a tab instead.

## Not planned

- Deleting or archiving mail. No write access is requested.
- Providers other than Gmail.
- Accounts, sync, or any hosted component.
- Unsubscribing automatically without a confirmation step.

## Install from source

Node 22 or later.

```
git clone https://github.com/drunkenEngineer/mailmoss.git
cd mailmoss
npm install
cp .env.example .env
npm run build
```

Load `dist/` at `chrome://extensions` with developer mode on.

Gmail access needs your own Google Cloud project: enable the Gmail API, create an OAuth client of
type **Chrome Extension**, and put its ID in `.env`. [CONTRIBUTING.md](CONTRIBUTING.md) has the
full walkthrough, including the optional second client that enables switching accounts.

## Scripts

| Command            | Purpose                                             |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Dev server with hot reload, building to `dist-dev/` |
| `npm run build`    | Production build into `dist/`                       |
| `npm run verify`   | Lint, format, type check, unit tests, build         |
| `npm run test:e2e` | End-to-end tests against a real Chrome              |

## Worth reading if you are auditing this

- [`src/core/unsubscribe/`](src/core/unsubscribe/) — every request that leaves for a third party
- [`src/storage/`](src/storage/) — everything that reaches disk
- [`src/auth/scopes.ts`](src/auth/scopes.ts) — the entire access surface, in three declarations
- [PRIVACY.md](PRIVACY.md) — the policy, versioned alongside the code it describes

`core/` imports neither React nor the Chrome APIs. It takes plain objects and returns plain
objects, which is what makes it readable on its own and testable without a browser.

## Licence

MIT
