import { test, expect } from '@playwright/test';

test.describe('Register', () => {
  test('register page has form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByPlaceholder(/name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });
});
