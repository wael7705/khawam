import { test, expect } from '@playwright/test';

const ADMIN_USER = process.env.TEST_LOGIN_USERNAME ?? 'waeln4457@gmail.com';
const ADMIN_PASS = process.env.TEST_LOGIN_PASSWORD ?? 'w0966320114/s';

test.describe('Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/اسم المستخدم|username/i).fill(ADMIN_USER);
    await page.getByPlaceholder(/كلمة المرور|password/i).fill(ADMIN_PASS);
    await page.getByRole('button', { name: /تسجيل الدخول|Login/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|\?)/, { timeout: 10000 });
  });

  test('analytics page loads', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    await expect(page).toHaveURL(/\/dashboard\/analytics/);
    await expect(
      page.getByText(/التحليلات|Analytics/i).or(page.getByRole('heading'))
    ).toBeVisible({ timeout: 8000 });
  });
});
