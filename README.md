# QuietInbox

A Chrome extension that shows you which Gmail senders you never read, and lets you unsubscribe
from them in bulk. There is no backend: your mail is fetched from Google's API straight to your
browser, analysed locally, and never sent anywhere else.

Early development. Nothing here is usable yet.

## Local setup

```
npm install
cp .env.example .env
npm run build
```

Then load `dist/` through `chrome://extensions` with developer mode on.

Gmail API access needs a Google Cloud project and an OAuth client of type "Chrome Extension".
Both values go in `.env`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with extension HMR |
| `npm run build` | Type check, then build to `dist/` |
| `npm test` | Unit tests |

## Licence

MIT
