import { test, expect } from '@playwright/test';

const ADMIN_USER = process.env.TEST_LOGIN_USERNAME || 'waeln4457@gmail.com';
const ADMIN_PASS = process.env.TEST_LOGIN_PASSWORD || 'w0966320114/s';

test.describe('Dashboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/username/i).fill(ADMIN_USER);
    await page.getByPlaceholder(/password/i).fill(ADMIN_PASS);
    await page.getByRole('button', { name: /Login/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|\?)/, { timeout: 10000 });
  });

  test('dashboard tabs navigate', async ({ page }) => {
    await page.goto('/dashboard');
    const ordersLink = page.getByRole('link', { name: /Orders/i });
    await ordersLink.click();
    await expect(page).toHaveURL(/\/dashboard\/orders/);
  });
});
