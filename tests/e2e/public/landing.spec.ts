import { test, expect } from '../fixtures';

test.describe('Landing page', () => {
  test('renders hero and nav CTAs', async ({ page }) => {
    await page.goto('/landing');
    await expect(page).toHaveTitle(/QuidSafe/i);

    // Hero copy - RNW overflow containers make it "hidden" to Playwright's
    // visibility heuristic, so check DOM attachment, not visual visibility.
    await expect(page.getByText(/Tax,\s*sorted\./i).first()).toBeAttached();

    // Nav CTAs
    await expect(page.getByLabel(/log in/i).first()).toBeAttached();
    await expect(page.getByLabel(/start free trial/i).first()).toBeAttached();
  });

  test('nav CTA routes to signup', async ({ page }) => {
    await page.goto('/landing');
    await page.getByLabel(/start free trial/i).first().click();
    await expect(page).toHaveURL(/\/(auth\/)?signup/);
    await expect(page.getByText(/create your account/i).first()).toBeVisible();
  });

  test('nav sign in routes to login', async ({ page }) => {
    await page.goto('/landing');
    await page.getByLabel(/log in/i).first().click();
    await expect(page).toHaveURL(/\/(auth\/)?login/);
    await expect(page.getByText(/welcome back/i).first()).toBeAttached();
  });

  test('has canonical link and description meta', async ({ page }) => {
    await page.goto('/landing');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toMatch(/quidsafe\.uk/);

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(50);
  });
});
