import { expect, test } from '@playwright/test';

test('jarvis-mobile-boot renders on iPhone-sized WebKit/Chromium without a blank page', async ({ page }) => {
  const uncaught: string[] = [];
  page.on('pageerror', error => uncaught.push(error.message));

  const response = await page.goto('/', { waitUntil: 'networkidle' });
  expect(response?.ok()).toBeTruthy();

  await expect(page.locator('#root')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Jarvis\./i })).toBeVisible();

  const text = (await page.locator('body').innerText()).trim();
  expect(text.length).toBeGreaterThan(20);
  expect(uncaught).toEqual([]);

  const geometry = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    rootChildren: document.getElementById('root')?.children.length ?? 0
  }));

  expect(geometry.innerWidth).toBe(390);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.innerWidth + 1);
  expect(geometry.rootChildren).toBeGreaterThan(0);
});
