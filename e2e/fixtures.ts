import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test as base, chromium } from '@playwright/test'
import type { BrowserContext, Worker } from '@playwright/test'

const DIST = resolve(import.meta.dirname, '../dist')

type ExtensionFixtures = {
  context: BrowserContext
  extensionId: string
}

/**
 * Chrome only loads extensions into a persistent context, so each run gets a
 * throwaway profile directory rather than reusing one and inheriting state.
 */
export const test = base.extend<ExtensionFixtures>({
  context: async ({}, use) => {
    const profile = await mkdtemp(join(tmpdir(), 'mailmoss-e2e-'))

    // Chrome refuses to load extensions headlessly, so these run headed. On CI
    // that means a virtual display; see the workflow.
    const context = await chromium.launchPersistentContext(profile, {
      headless: false,
      args: [`--disable-extensions-except=${DIST}`, `--load-extension=${DIST}`],
    })

    await use(context)

    await context.close()
    await rm(profile, { recursive: true, force: true })
  },

  extensionId: async ({ context }, use) => {
    // The service worker's URL carries the id, and it is the first thing the
    // extension starts, so waiting on it also proves the manifest parsed.
    const worker: Worker =
      context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'))

    await use(new URL(worker.url()).host)
  },
})

export const expect = test.expect
