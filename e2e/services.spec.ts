import { test, expect } from '@playwright/test';

test.describe('Services', () => {
  test('services page loads', async ({ page }) => {
    await page.goto('/services');
    await expect(page).toHaveURL(/\/services/);
    await expect(page.locator('body')).toBeVisible();
  });
});
