import { test, expect } from '../fixtures';

test.describe('Auth redirects', () => {
  test('unauthenticated user visiting root is redirected to /landing', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/landing/, { timeout: 20_000 });
    await expect(page.getByText(/Tax,\s*sorted\./i).first()).toBeAttached();
  });

  test('unauthenticated user visiting /settings is redirected to /landing', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/landing/, { timeout: 20_000 });
  });

  test('landing page stays on landing for unauthenticated users', async ({ page }) => {
    await page.goto('/landing');
    await expect(page.getByText(/Tax,\s*sorted\./i).first()).toBeAttached({ timeout: 15_000 });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/landing/);
  });

  test('login page stays on login for unauthenticated users', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/welcome back/i).first()).toBeAttached({ timeout: 15_000 });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/login/);
  });
});
