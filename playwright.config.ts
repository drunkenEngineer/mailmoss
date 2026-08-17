import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // The extension is loaded once per worker into a persistent profile, and
  // shares chrome.storage; parallel workers would fight over it.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    trace: 'retain-on-failure',
  },
})
