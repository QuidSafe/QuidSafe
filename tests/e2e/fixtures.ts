import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Dismiss cookie consent banner before each test by pre-setting localStorage.
    // The CookieConsent component checks for 'qs_cookie_consent' in localStorage
    // and hides the banner if it exists.
    await page.addInitScript(() => {
      try {
        localStorage.setItem(
          'qs_cookie_consent',
          JSON.stringify({ status: 'accepted', date: '2026-01-01' }),
        );
      } catch {
        // localStorage unavailable — banner will show, tests may flake
      }
    });
    await use(page);
  },
});

export { expect };
