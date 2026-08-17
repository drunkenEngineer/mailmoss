import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

// The published policy is generated from the same PRIVACY.md that ships in the
// repository, so the page and the file can never drift apart.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '_site')

const markdown = await readFile(resolve(root, 'PRIVACY.md'), 'utf8')
const logo = await readFile(resolve(root, 'assets/logo.svg'), 'utf8')

// Strip the XML bits so it can be inlined, and let CSS size it.
const inlineLogo = logo
  .replace(/<\?xml[^>]*\?>/, '')
  .replace('<svg ', '<svg class="mark" ')
  .trim()

const body = await marked.parse(markdown, { gfm: true })

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mailmoss — Privacy Policy</title>
    <meta
      name="description"
      content="Mailmoss has no server. What it reads, what it stores, and what leaves your computer."
    />
    <meta name="color-scheme" content="light dark" />
    <link
      rel="icon"
      href="data:image/svg+xml,${encodeURIComponent(logo.replace(/\n\s*/g, ''))}"
    />
    <style>
      :root {
        --bg: #ffffff;
        --panel: #f6faf7;
        --ink: #16261d;
        --muted: #4a6357;
        --line: #dde7e0;
        --accent: #15803d;
        --accent-soft: #eaf7ee;
        --code: #f1f5f2;
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #08150f;
          --panel: #0e2018;
          --ink: #e4efe8;
          --muted: #9db3a6;
          --line: #1b3327;
          --accent: #4ade80;
          --accent-soft: #102c1d;
          --code: #10241a;
        }
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        background:
          radial-gradient(120vw 60vh at 50% -10%, var(--accent-soft), transparent 70%),
          var(--bg);
        color: var(--ink);
        font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
        font-size: 17px;
        line-height: 1.65;
        -webkit-font-smoothing: antialiased;
      }

      .wrap { max-width: 46rem; margin: 0 auto; padding: 4rem 1.5rem 6rem; }

      header {
        display: flex;
        align-items: center;
        gap: 0.9rem;
        padding-bottom: 1.75rem;
        margin-bottom: 2.5rem;
        border-bottom: 1px solid var(--line);
      }

      .mark { width: 48px; height: 48px; border-radius: 12px; flex: none; }

      header .name { font-size: 1.15rem; font-weight: 650; letter-spacing: -0.01em; }
      header .tag { color: var(--muted); font-size: 0.9rem; }
      header a { color: inherit; text-decoration: none; }

      h1 { font-size: 2rem; line-height: 1.2; letter-spacing: -0.02em; margin: 0 0 0.5rem; }

      h2 {
        font-size: 1.2rem;
        letter-spacing: -0.01em;
        margin: 3rem 0 0.75rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--line);
      }

      h1 + p { color: var(--muted); font-size: 0.95rem; }

      a { color: var(--accent); text-underline-offset: 3px; }

      strong { font-weight: 650; }

      code {
        background: var(--code);
        border: 1px solid var(--line);
        border-radius: 5px;
        padding: 0.1em 0.4em;
        font-size: 0.86em;
        font-family: ui-monospace, 'Cascadia Code', Menlo, monospace;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        font-size: 0.94rem;
        display: block;
        overflow-x: auto;
      }

      th, td {
        text-align: left;
        padding: 0.7rem 0.9rem;
        border-bottom: 1px solid var(--line);
        vertical-align: top;
      }

      th { font-weight: 600; color: var(--muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }

      tr:last-child td { border-bottom: 0; }

      ul, ol { padding-left: 1.25rem; }
      li { margin: 0.4rem 0; }

      footer {
        margin-top: 4rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 0.88rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1.25rem;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header>
        ${inlineLogo}
        <div>
          <div class="name">Mailmoss</div>
          <div class="tag">Senders you never read</div>
        </div>
      </header>

      <main>${body}</main>

      <footer>
        <a href="https://github.com/drunkenEngineer/mailmoss">Source on GitHub</a>
        <span>No server. No analytics. MIT licensed.</span>
      </footer>
    </div>
  </body>
</html>
`

await mkdir(outDir, { recursive: true })
await writeFile(resolve(outDir, 'index.html'), html)
console.log(`_site/index.html  ${String(html.length)} bytes`)
