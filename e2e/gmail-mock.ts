import type { BrowserContext, Route } from '@playwright/test'

export const TEST_EMAIL = 'tester@example.com'

type Header = { name: string; value: string }

type MockMessage = {
  id: string
  labelIds: string[]
  internalDate: string
  headers: Header[]
}

const DAY = 24 * 60 * 60 * 1000

function message(options: {
  id: string
  from: string
  daysAgo?: number
  unread?: boolean
  starred?: boolean
  listUnsubscribe?: string
  oneClick?: boolean
}): MockMessage {
  const headers: Header[] = [{ name: 'From', value: options.from }]
  if (options.listUnsubscribe !== undefined) {
    headers.push({ name: 'List-Unsubscribe', value: options.listUnsubscribe })
  }
  if (options.oneClick === true) {
    headers.push({ name: 'List-Unsubscribe-Post', value: 'List-Unsubscribe=One-Click' })
  }

  const labelIds = ['INBOX']
  if (options.unread !== false) labelIds.push('UNREAD')
  if (options.starred === true) labelIds.push('STARRED')

  return {
    id: options.id,
    labelIds,
    internalDate: String(Date.now() - (options.daysAgo ?? 1) * DAY),
    headers,
  }
}

/**
 * One sender per unsubscribe route, plus an engaged and a read sender, so the
 * ranking and the badges have something to distinguish.
 */
function buildMessages(): MockMessage[] {
  const messages: MockMessage[] = []

  for (let i = 0; i < 5; i += 1) {
    messages.push(
      message({
        id: `oneclick-${String(i)}`,
        from: 'Promo Weekly <promo@oneclick.test>',
        listUnsubscribe: '<https://oneclick.test/u>',
        oneClick: true,
      }),
    )
  }

  for (let i = 0; i < 3; i += 1) {
    messages.push(
      message({
        id: `link-${String(i)}`,
        from: '=?UTF-8?Q?Caf=C3=A9_du_Coin?= <news@link.test>',
        listUnsubscribe: '<https://link.test/u>',
      }),
    )
  }

  messages.push(
    message({
      id: 'mailto-0',
      from: 'Mailing List <list@mailto.test>',
      listUnsubscribe: '<mailto:stop@mailto.test>',
    }),
  )

  messages.push(message({ id: 'none-0', from: 'No Route <hello@none.test>' }))

  messages.push(
    message({ id: 'engaged-0', from: 'Starred Sender <fav@engaged.test>', starred: true }),
  )

  messages.push(message({ id: 'read-0', from: 'Read Sender <read@read.test>', unread: false }))

  return messages
}

export const MOCK_MESSAGES = buildMessages()

/** How many distinct senders the fixtures produce. */
export const MOCK_SENDER_COUNT = new Set(
  MOCK_MESSAGES.map((m) => m.headers[0]?.value.match(/<(.+)>/)?.[1] ?? ''),
).size

function json(route: Route, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

/**
 * Replaces Gmail and the sign-in step so the panel can be driven end to end
 * without a Google account. Everything downstream of the token is the real
 * code: the same client, runner, aggregation and unsubscribe paths.
 */
export async function mockGmail(context: BrowserContext) {
  await context.addInitScript(() => {
    type Stub = {
      identity?: Record<string, unknown>
      permissions?: Record<string, unknown>
      tabs?: Record<string, unknown>
    }
    const api = (globalThis as unknown as { chrome?: Stub }).chrome
    if (!api?.identity) return

    api.identity.getAuthToken = () =>
      Promise.resolve({
        token: 'test-token',
        grantedScopes: ['https://www.googleapis.com/auth/gmail.metadata'],
      })
    api.identity.removeCachedAuthToken = () => Promise.resolve()
    api.identity.clearAllCachedAuthTokens = () => Promise.resolve()

    if (api.permissions) {
      api.permissions.contains = () => Promise.resolve(true)
      api.permissions.request = () => Promise.resolve(true)
    }

    // Record opened tabs instead of opening them, so the fallback paths can be
    // asserted without a dozen windows appearing.
    const opened: string[] = []
    ;(globalThis as unknown as { __openedTabs: string[] }).__openedTabs = opened
    if (api.tabs) {
      api.tabs.create = (options: { url: string }) => {
        opened.push(options.url)
        return Promise.resolve({ id: opened.length })
      }
    }
  })

  await context.route('**://gmail.googleapis.com/**', (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname

    if (path.endsWith('/users/me/profile')) {
      return json(route, {
        emailAddress: TEST_EMAIL,
        messagesTotal: MOCK_MESSAGES.length,
        threadsTotal: MOCK_MESSAGES.length,
        historyId: '1000',
      })
    }

    if (path.endsWith('/users/me/history')) {
      return json(route, { historyId: '1000' })
    }

    const single = /\/users\/me\/messages\/(.+)$/.exec(path)
    if (single) {
      const found = MOCK_MESSAGES.find((m) => m.id === single[1])
      if (!found) return route.fulfill({ status: 404, body: '{}' })
      return json(route, {
        id: found.id,
        threadId: found.id,
        labelIds: found.labelIds,
        internalDate: found.internalDate,
        payload: { headers: found.headers },
      })
    }

    if (path.endsWith('/users/me/messages')) {
      // Only the first category returns anything; the rest come back empty, so
      // the runner's per-label walk is exercised without duplicating senders.
      const label = url.searchParams.get('labelIds')
      const messages =
        label === 'CATEGORY_PROMOTIONS'
          ? MOCK_MESSAGES.map((m) => ({ id: m.id, threadId: m.id }))
          : []
      return json(route, { messages, resultSizeEstimate: messages.length })
    }

    return route.fulfill({ status: 404, body: '{}' })
  })

  // The unsubscribe endpoints belong to the fictional senders above.
  await context.route('**://oneclick.test/**', (route) =>
    route.fulfill({ status: 200, body: 'ok' }),
  )
  await context.route('**://link.test/**', (route) => route.fulfill({ status: 200, body: 'ok' }))
}
