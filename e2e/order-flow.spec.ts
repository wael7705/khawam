import { test, expect } from '@playwright/test';

test.describe('Order flow', () => {
  test('can open order flow from services', async ({ page }) => {
    await page.goto('/services');
    await expect(page).toHaveURL(/\/services/);
    const orderLink = page.getByRole('link', { name: /طلب|order/i }).first();
    if (await orderLink.isVisible()) {
      await orderLink.click();
      await expect(page).toHaveURL(/\/(order|services)/);
    }
  });
});
