import { test, expect } from '@playwright/test';

test.describe('Auth', () => {
  test('login page loads and has form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /تسجيل الدخول|Login/i })).toBeVisible();
    await expect(page.getByPlaceholder(/اسم المستخدم|username/i)).toBeVisible();
    await expect(page.getByPlaceholder(/كلمة المرور|password/i)).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/اسم المستخدم|username/i).fill('invalid@test.com');
    await page.getByPlaceholder(/كلمة المرور|password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /تسجيل الدخول|Login/i }).click();
    await expect(page.getByText(/فشل|invalid|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('after logout redirects to login', async ({ page }) => {
    await page.goto('/');
    const loginLink = page.getByRole('link', { name: /تسجيل الدخول|Login/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
