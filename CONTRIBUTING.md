# Contributing

## Setup

Node 22 or later (`.nvmrc` pins the exact version used in CI).

```
npm install
cp .env.example .env
npm run build
```

Load `dist/` at `chrome://extensions` with developer mode enabled.

`npm run dev` builds to `dist-dev/` instead, because a dev build only works while Vite is
running and would otherwise replace the standalone one you had loaded. Point Chrome at
`dist-dev/` when you want hot reload, and at `dist/` the rest of the time.

Gmail access needs your own Google Cloud project and an OAuth client of type "Chrome Extension".
Both values go in `.env`; neither is committed.

## Before opening a pull request

```
npm run verify
```

That runs lint, format, type check, unit tests and build in order. CI runs the same thing, so a
green local run means a green pipeline.

End-to-end tests load the built extension into a real Chrome:

```
npm run test:e2e
```

They need a build first (`npm run build`) and a real display: Chrome refuses to load extensions
headlessly, so Playwright runs headed. On a headless machine, prefix with `xvfb-run`, which is
what CI does.

Hooks are installed by `npm install`: `pre-commit` formats and lints staged files, `pre-push`
type checks and runs the tests.

## Icons

`assets/logo.svg` is the source. The PNGs Chrome needs are generated from it:

```
npm run icons
```

That writes `public/icons/icon-{16,32,48,128}.png`. Edit the SVG and regenerate; never hand-edit
the PNGs, since the next run overwrites them.

## Branches and commits

Work on a branch off `main`, named `type/short-description`:

```
feat/sender-aggregation
fix/pagination-token-reset
chore/bump-vite
```

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org):

```
feat(scan): resume from checkpoint after panel close
fix(parse): decode RFC 2047 encoded words in From headers
```

Keep the subject under 72 characters and use the body to say why, not what. The diff already
says what.

## Code layout

```
src/
  background/   service worker: side panel wiring, token handling
  sidepanel/    React UI, and the host for long-running scans
  core/         pure logic: Gmail client, parsing, aggregation, unsubscribe
  storage/      chrome.storage wrapper and schema migrations
  types/        shared domain types
tests/
  fixtures/     anonymised Gmail API responses
```

`core/` must not import React or call `chrome.*`. It takes plain objects and returns plain
objects, which is what makes it testable without a browser and readable to someone auditing the
project. Pass anything environment-specific in as an argument.

## Things held to a higher bar

This project's entire value is that its behaviour can be verified by reading it. Changes in
these areas need explicit justification in the pull request:

- Any new permission, host permission, or OAuth scope.
- Any network call to a host other than the Gmail API.
- Anything that stores message content rather than per-sender aggregates.
- Any analytics, telemetry, or crash reporting. The answer here is no.

## Language

**The codebase is English only.** Code, identifiers, comments, commit messages, pull requests
and documentation are written in English, with no exceptions.

**The product ships in English and French.** That is a separate concern, handled by the
translation layer rather than by writing French anywhere else in the repository.

No user-visible string is ever hardcoded in a component. Add the key to `src/i18n/locales/en.ts`,
which is the source of truth and defines the `Messages` type, then add the same key to `fr.ts`.
A missing or extra key fails type checking, and the catalogue tests also assert that every locale
covers every key with a non-empty string.

Strings that Chrome itself displays, meaning the extension name and description in the Web Store
listing, live in `public/_locales/<locale>/messages.json` and are referenced from the manifest
as `__MSG_key__`. That mechanism is separate from the in-app layer because Chrome resolves it
before the extension runs.

There are no exceptions: nothing may hardcode a user-visible string.
