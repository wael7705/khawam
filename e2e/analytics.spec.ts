import { test, expect } from '@playwright/test';

const ADMIN_USER = process.env.TEST_LOGIN_USERNAME ?? 'waeln4457@gmail.com';
const ADMIN_PASS = process.env.TEST_LOGIN_PASSWORD ?? 'w0966320114/s';

test.describe('Dashboard Home Analytics Summary', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/اسم المستخدم|username/i).fill(ADMIN_USER);
    await page.getByPlaceholder(/كلمة المرور|password/i).fill(ADMIN_PASS);
    await page.getByRole('button', { name: /تسجيل الدخول|Login/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|\?)/, { timeout: 10000 });
  });

  test('home tab shows analytics summary cards', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByText(/ملخص التحليلات|Analytics Summary/i)
    ).toBeVisible({ timeout: 8000 });
    await expect(
      page.getByText(/إجمالي الزوار|Total Visitors/i)
    ).toBeVisible({ timeout: 8000 });
  });
});
