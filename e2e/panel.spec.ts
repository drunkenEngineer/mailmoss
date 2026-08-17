import { expect, test } from './fixtures'

/**
 * These run against the real built extension in a real Chrome. They cover what
 * unit tests cannot: that the manifest parses, the service worker starts, the
 * bundle executes under the extension CSP, and the panel paints.
 *
 * They stop at the sign-in button. Everything past it needs a Google account,
 * and faking one would test the fake rather than the extension.
 */
test('the service worker starts, which means the manifest parsed', async ({ extensionId }) => {
  expect(extensionId).toMatch(/^[a-p]{32}$/)
})

test('the side panel renders the connect screen with no console errors', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage()
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto(`chrome-extension://${extensionId}/src/sidepanel/index.html`)

  await expect(page.getByRole('heading', { name: 'Mailmoss' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Connect Gmail' })).toBeVisible()
  expect(errors).toEqual([])
})

test('the theme follows the browser and can be overridden', async ({ context, extensionId }) => {
  const page = await context.newPage()
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto(`chrome-extension://${extensionId}/src/sidepanel/index.html`)

  const root = page.locator('html')
  await expect(root).toHaveAttribute('data-theme', 'dark')

  await page.getByLabel('Theme').selectOption('light')
  await expect(root).toHaveAttribute('data-theme', 'light')

  // The override has to beat the browser, not merely differ from it.
  await page.getByLabel('Theme').selectOption('system')
  await expect(root).toHaveAttribute('data-theme', 'dark')
})

test('the interface switches language', async ({ context, extensionId }) => {
  const page = await context.newPage()
  await page.goto(`chrome-extension://${extensionId}/src/sidepanel/index.html`)

  await expect(page.getByRole('button', { name: 'Connect Gmail' })).toBeVisible()

  await page.getByRole('combobox').last().selectOption('fr')
  await expect(page.getByRole('button', { name: 'Connecter Gmail' })).toBeVisible()
})

test('the language choice survives a reload', async ({ context, extensionId }) => {
  const page = await context.newPage()
  const url = `chrome-extension://${extensionId}/src/sidepanel/index.html`

  await page.goto(url)
  await page.getByRole('combobox').last().selectOption('fr')
  await expect(page.getByRole('button', { name: 'Connecter Gmail' })).toBeVisible()

  await page.goto(url)
  await expect(page.getByRole('button', { name: 'Connecter Gmail' })).toBeVisible()
})

test('nothing is requested from outside Google before sign-in', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage()
  const external: string[] = []

  page.on('request', (request) => {
    const url = request.url()
    if (url.startsWith('chrome-extension://') || url.startsWith('data:')) return
    if (/(^https:\/\/([a-z0-9-]+\.)*google(apis)?\.com)/.test(url)) return
    external.push(url)
  })

  await page.goto(`chrome-extension://${extensionId}/src/sidepanel/index.html`)
  await expect(page.getByRole('button', { name: 'Connect Gmail' })).toBeVisible()
  await page.waitForTimeout(500)

  expect(external).toEqual([])
})
