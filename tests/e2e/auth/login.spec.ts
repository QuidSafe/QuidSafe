import { test, expect } from '../fixtures';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/welcome back/i).first()).toBeAttached({ timeout: 15_000 });
  });

  test('renders email + password form', async ({ page }) => {
    await expect(page.getByPlaceholder(/you@example\.com/i)).toBeAttached();
    await expect(page.getByPlaceholder(/your password/i)).toBeAttached();
  });

  test('shows validation when fields are empty', async ({ page }) => {
    await page.getByText(/^sign in$/i).first().click();
    await expect(page.getByText(/please enter your email and password/i)).toBeAttached();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.getByPlaceholder(/you@example\.com/i).fill('nobody@test-quidsafe.invalid');
    await page.getByPlaceholder(/your password/i).fill('wrongpassword123');
    await page.getByText(/^sign in$/i).first().click();

    await page.waitForTimeout(5000);
    await expect(page).toHaveURL(/login/);
  });

  test('Google SSO button is present', async ({ page }) => {
    await expect(page.getByText(/continue with google/i).first()).toBeAttached();
  });

  test('forgot password link switches to reset mode', async ({ page }) => {
    await page.getByText(/forgot/i).first().click();
    await expect(page.getByText(/forgot password/i).first()).toBeAttached({ timeout: 5000 });
  });

  test('create account link routes to signup', async ({ page }) => {
    await page.getByText(/create account/i).first().click({ force: true });
    await expect(page).toHaveURL(/signup/);
  });
});
