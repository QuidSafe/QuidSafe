import { defineConfig, devices } from '@playwright/test';

// Default: run against the live production deployment.
// Override with PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 for local builds,
// which requires a pk_test_ Clerk key (see docs/E2E.md).
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://quidsafe.uk';
const IS_LOCAL = BASE_URL.includes('127.0.0.1') || BASE_URL.includes('localhost');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: IS_LOCAL
    ? {
        command: 'npx serve dist --listen 4173 --single --no-clipboard',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      }
    : undefined,
});
