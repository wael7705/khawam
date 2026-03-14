import { test, expect } from '@playwright/test';

const ADMIN_USER = process.env.TEST_LOGIN_USERNAME || 'waeln4457@gmail.com';
const ADMIN_PASS = process.env.TEST_LOGIN_PASSWORD || 'w0966320114/s';

test.describe('Orders admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/اسم المستخدم|username/i).fill(ADMIN_USER);
    await page.getByPlaceholder(/كلمة المرور|password/i).fill(ADMIN_PASS);
    await page.getByRole('button', { name: /تسجيل الدخول|Login/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|\?)/, { timeout: 10000 });
  });

  test('orders management page loads', async ({ page }) => {
    await page.goto('/dashboard/orders');
    await expect(page).toHaveURL(/\/dashboard\/orders/);
    await expect(
      page.getByText(/إدارة الطلبات|Orders|طلبات/i).or(page.getByRole('heading'))
    ).toBeVisible({ timeout: 8000 });
  });
});
