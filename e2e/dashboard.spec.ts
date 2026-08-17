import { expect, test } from './fixtures'
import { MOCK_SENDER_COUNT, TEST_EMAIL, mockGmail } from './gmail-mock'
import type { Page } from '@playwright/test'

/**
 * Everything past the sign-in button, driven against a replaced Gmail. Only the
 * token and the API responses are faked; the client, scan runner, aggregation,
 * storage and unsubscribe paths are the real code.
 */
async function connectAndScan(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/src/sidepanel/index.html`)
  await page.getByRole('button', { name: 'Connect Gmail' }).click()

  await expect(page.getByText(TEST_EMAIL)).toBeVisible()

  await page.getByRole('button', { name: 'Scan my inbox' }).click()
  await expect(page.getByText(/Scanned \d+ messages/)).toBeVisible({ timeout: 15_000 })
}

test.beforeEach(async ({ context }) => {
  await mockGmail(context)
})

test('a scan finds every sender and ranks the most ignored first', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage()
  await connectAndScan(page, extensionId)

  // Exact, because the scan summary sentence also ends in "N senders".
  await expect(
    page.getByText(`${String(MOCK_SENDER_COUNT)} senders`, { exact: true }),
  ).toBeVisible()

  // Five messages from one sender, one from each of the others, so it leads.
  const first = page.locator('label').first()
  await expect(first).toContainText('promo@oneclick.test')
  await expect(first).toContainText('5 messages')
})

test('encoded sender names are decoded rather than shown as mojibake', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage()
  await connectAndScan(page, extensionId)

  await expect(page.getByText('Café du Coin')).toBeVisible()
  await expect(page.getByText('=?UTF-8?Q?')).toHaveCount(0)
})

test('each unsubscribe route is detected and labelled', async ({ context, extensionId }) => {
  const page = await context.newPage()
  await connectAndScan(page, extensionId)

  const row = (address: string) => page.locator('label').filter({ hasText: address })

  await expect(row('promo@oneclick.test')).toContainText('One click')
  await expect(row('news@link.test')).toContainText('Link')
  await expect(row('list@mailto.test')).toContainText('Email')
  await expect(row('hello@none.test')).toContainText('No link')
})

test('a starred sender is marked as engaged and ranked below the ignored ones', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage()
  await connectAndScan(page, extensionId)

  const engaged = page.locator('label').filter({ hasText: 'fav@engaged.test' })
  await expect(engaged).toContainText('starred or replied')
  await expect(page.locator('label').last()).toContainText('fav@engaged.test')
})

test('search narrows the list and clearing it restores', async ({ context, extensionId }) => {
  const page = await context.newPage()
  await connectAndScan(page, extensionId)

  await page.getByPlaceholder('Search sender or domain').fill('oneclick')
  await expect(page.getByText('1 senders', { exact: true })).toBeVisible()

  await page.getByPlaceholder('Search sender or domain').fill('')
  // Exact, because the scan summary sentence also ends in "N senders".
  await expect(
    page.getByText(`${String(MOCK_SENDER_COUNT)} senders`, { exact: true }),
  ).toBeVisible()
})

test('a filter narrows to senders that were never opened', async ({ context, extensionId }) => {
  const page = await context.newPage()
  await connectAndScan(page, extensionId)

  await page.getByRole('button', { name: /^Never opened/ }).click()

  // The sender whose message is already read drops out.
  await expect(page.locator('label').filter({ hasText: 'read@read.test' })).toHaveCount(0)
  await expect(page.locator('label').filter({ hasText: 'promo@oneclick.test' })).toBeVisible()
})

test('select all covers the filtered view, not the whole list', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage()
  await connectAndScan(page, extensionId)

  await page.getByPlaceholder('Search sender or domain').fill('oneclick')
  await page.getByRole('button', { name: 'Select all' }).click()

  await expect(page.getByText('1 selected')).toBeVisible()
})

test('unsubscribing reports one-click and tab fallbacks separately', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage()
  await connectAndScan(page, extensionId)

  await page.getByRole('button', { name: 'Select all' }).click()
  await page.getByRole('button', { name: 'Unsubscribe', exact: true }).click()

  // The confirmation covers the list rather than replacing it, so assertions
  // are scoped to the dialog or they match the rows underneath as well.
  const confirm = page.getByRole('dialog')
  await expect(confirm.getByRole('heading', { name: /Unsubscribe from \d+ senders/ })).toBeVisible()
  await expect(confirm.getByText('promo@oneclick.test')).toBeVisible()

  await confirm.getByRole('button', { name: 'Unsubscribe', exact: true }).click()

  const report = page.getByRole('dialog')
  await expect(report.getByRole('heading', { name: 'Done' })).toBeVisible({ timeout: 30_000 })
  await expect(report.getByText(/1 unsubscribed/)).toBeVisible()
  await expect(report.getByText(/opened in a tab/)).toBeVisible()

  // The senders without one-click were sent to a tab rather than posted to.
  const opened = await page.evaluate(
    () => (globalThis as unknown as { __openedTabs: string[] }).__openedTabs,
  )
  expect(opened.some((url) => url.includes('link.test'))).toBe(true)
  expect(opened.some((url) => url.includes('view=cm'))).toBe(true)
  expect(opened.some((url) => url.includes('search'))).toBe(true)
})

test('a completed scan is restored after the panel is closed', async ({ context, extensionId }) => {
  const page = await context.newPage()
  await connectAndScan(page, extensionId)
  await page.close()

  const reopened = await context.newPage()
  await reopened.goto(`chrome-extension://${extensionId}/src/sidepanel/index.html`)
  await reopened.getByRole('button', { name: 'Connect Gmail' }).click()

  await expect(
    reopened.getByText(`${String(MOCK_SENDER_COUNT)} senders`, { exact: true }),
  ).toBeVisible()
})
