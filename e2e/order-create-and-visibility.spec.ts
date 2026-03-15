/**
 * E2E: Create order with file upload, then verify it appears in My Orders and in Admin Orders.
 * Requires backend running (e.g. pnpm dev:backend) and DB seeded; frontend is started by Playwright.
 */
import { test, expect } from '@playwright/test';
import { join } from 'node:path';

const ADMIN_USER = process.env.TEST_LOGIN_USERNAME || 'waeln4457@gmail.com';
const ADMIN_PASS = process.env.TEST_LOGIN_PASSWORD || 'w0966320114/s';

const FIXTURE_PDF = join(process.cwd(), 'e2e', 'fixtures', 'sample-upload.pdf');

test.describe('Order create and visibility', () => {
  const customerEmail = `e2e-customer-${Date.now()}@example.com`;
  const customerPassword = 'e2e-test-pass-123';
  const customerName = 'E2E Test Customer';

  test('create order with file upload, then visible in my-orders and admin orders', async ({
    page,
  }) => {
    await page.goto('/register');
    await expect(page.getByPlaceholder(/name|الاسم/i).first()).toBeVisible({ timeout: 8000 });

    await page.getByPlaceholder(/name|الاسم/i).first().fill(customerName);
    await page.getByPlaceholder(/phone|هاتف|رقم/i).first().fill('0911111111');
    await page.getByPlaceholder(/email|بريد/i).first().fill(customerEmail);
    await page.getByPlaceholder(/password|كلمة المرور/i).first().fill(customerPassword);
    await page.getByRole('button', { name: /تسجيل|register/i }).click();

    await expect(page).toHaveURL(/\/(\?|$|my-orders|services)/, { timeout: 15000 });

    await page.goto('/services');
    await expect(page).toHaveURL(/\/services/);

    const orderBtn = page.getByRole('button', { name: /اطلب خدمة|order service/i }).first();
    await orderBtn.click();

    const modal = page.locator('.order-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const fileInput = modal.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_PDF);

    await expect(modal.getByText(/\.pdf|file-item|sample-upload/i)).toBeVisible({ timeout: 3000 });

    const nextBtn = modal.getByRole('button', { name: /التالي|next/i });
    while ((await nextBtn.isVisible()) && (await nextBtn.isEnabled())) {
      await nextBtn.click();
      await page.waitForTimeout(400);
    }

    const confirmBtn = modal.getByRole('button', { name: /تأكيد الطلب|confirm order/i });
    await expect(confirmBtn).toBeVisible({ timeout: 3000 });
    await confirmBtn.click();

    await expect(
      modal.getByText(/تم إرسال طلبك بنجاح|order submitted successfully/i)
    ).toBeVisible({ timeout: 20000 });

    const orderNumberEl = modal.locator('.order-success__number');
    await expect(orderNumberEl).toBeVisible({ timeout: 5000 });
    const orderNumberText = await orderNumberEl.textContent();
    const orderNumber = orderNumberText?.replace(/^#/, '').trim() ?? '';

    await modal.getByRole('button', { name: /حسناً|ok/i }).click();

    await page.goto('/my-orders');
    await expect(page).toHaveURL(/\/my-orders/);
    await expect(page.getByText(orderNumber, { exact: false })).toBeVisible({ timeout: 10000 });

    await page.locator('.navbar__user-btn').click();
    await page.getByRole('button', { name: /تسجيل الخروج|logout/i }).click();
    await expect(page).toHaveURL(/\/(login|\?)/, { timeout: 5000 });

    await page.goto('/login');
    await page.getByPlaceholder(/اسم المستخدم|username/i).fill(ADMIN_USER);
    await page.getByPlaceholder(/كلمة المرور|password/i).fill(ADMIN_PASS);
    await page.getByRole('button', { name: /تسجيل الدخول|login/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|\?)/, { timeout: 10000 });

    await page.goto('/dashboard/orders');
    await expect(page).toHaveURL(/\/dashboard\/orders/);
    await expect(
      page.getByText(/إدارة الطلبات|orders|طلبات/i).or(page.getByRole('heading'))
    ).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(orderNumber, { exact: false })).toBeVisible({ timeout: 10000 });
  });
});
