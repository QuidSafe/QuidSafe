import { test, expect } from '../fixtures';

test.describe('Signup page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByText(/create your account/i).first()).toBeAttached({ timeout: 15_000 });
  });

  test('renders name + email + password form', async ({ page }) => {
    await expect(page.getByPlaceholder(/jane smith/i)).toBeAttached();
    await expect(page.getByPlaceholder(/you@example\.com/i)).toBeAttached();
    await expect(page.getByPlaceholder(/minimum 8 characters/i)).toBeAttached();
  });

  test('shows validation for short name', async ({ page }) => {
    await page.getByPlaceholder(/jane smith/i).fill('A');
    await page.getByPlaceholder(/you@example\.com/i).fill('test@example.com');
    await page.getByPlaceholder(/minimum 8 characters/i).fill('password123');
    // Target the primary CTA button specifically
    await page.getByText(/^create account$/i).first().click({ force: true });
    await expect(page.getByText(/please enter your name/i)).toBeAttached({ timeout: 5000 });
  });

  test('shows validation for invalid email', async ({ page }) => {
    await page.getByPlaceholder(/jane smith/i).fill('Test User');
    await page.getByPlaceholder(/you@example\.com/i).fill('notanemail');
    await page.getByPlaceholder(/minimum 8 characters/i).fill('password123');
    await page.getByText(/^create account$/i).first().click({ force: true });
    await expect(page.getByText(/valid email/i)).toBeAttached({ timeout: 5000 });
  });

  test('shows password helper for short passwords', async ({ page }) => {
    await page.getByPlaceholder(/minimum 8 characters/i).fill('short');
    await expect(page.getByText(/more character/i).first()).toBeAttached();
  });

  test('Google SSO button is present', async ({ page }) => {
    await expect(page.getByText(/continue with google/i).first()).toBeAttached();
  });

  test('sign in link routes to login', async ({ page }) => {
    await page.getByText(/^sign in$/i).first().click({ force: true });
    await expect(page).toHaveURL(/login/);
  });
});
