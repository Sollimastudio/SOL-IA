import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Browser cannot contact Supabase, email delivery, an AI model or any external service.
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
  });
});

test.afterEach(async ({ page }, info) => {
  await page.screenshot({ path: info.outputPath('login.png'), fullPage: true });
});

test('anonymous visitor requests and verifies an eight-digit code without leaving the page', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?case=ready');
  await expect(page.getByRole('heading', { name: 'Entrar no Jarvis' })).toBeVisible();
  await expect(page.getByLabel('Seu e-mail')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar código' })).toBeVisible();
  await expect(page.locator('textarea')).toHaveCount(0);
  await page.getByLabel('Seu e-mail').fill('teste@example.invalid');
  await page.getByRole('button', { name: 'Enviar código' }).click();
  await expect(page.getByRole('status')).toContainText('Código enviado');
  await expect(page.getByLabel('Código de acesso')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__authAttempts)).toBe(1);
  await page.getByLabel('Código de acesso').fill('12345678');
  await page.getByRole('button', { name: 'Entrar no Jarvis' }).click();
  await expect(page.getByRole('status')).toContainText('Acesso confirmado');
  expect(await page.evaluate(() => (window as any).__authVerifications)).toBe(1);
  expect(errors).toEqual([]);
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflows).toBe(false);
});

for (const scenario of ['disabled', 'unconfigured']) {
  test(`${scenario}: blocked access is explicit and asks for no impossible action`, async ({ page }) => {
    await page.goto(`/?case=${scenario}`);
    await expect(page.getByRole('heading', { name: 'Acesso ainda não liberado' })).toBeVisible();
    await expect(page.getByText('Não falta nenhuma ação sua nesta tela.')).toBeVisible();
    await expect(page.getByLabel('Seu e-mail')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Enviar código' })).toHaveCount(0);
    await expect(page.locator('textarea')).toHaveCount(0);
  });
}

test('a failed request unlocks the form and keeps the email for retry', async ({ page }) => {
  await page.goto('/?case=failure');
  await page.getByLabel('Seu e-mail').fill('teste@example.invalid');
  await page.getByRole('button', { name: 'Enviar código' }).click();
  await expect(page.getByRole('status')).toHaveText('Não foi possível enviar o código. Tente novamente.');
  await expect(page.getByLabel('Seu e-mail')).toHaveValue('teste@example.invalid');
  await expect(page.getByRole('button', { name: 'Enviar código' })).toBeEnabled();
  await page.getByRole('button', { name: 'Enviar código' }).click();
  await expect(page.getByRole('status')).toContainText('Código enviado');
  expect(await page.evaluate(() => (window as any).__authAttempts)).toBe(2);
});

test('invalid code is rejected and user remains on verification step', async ({ page }) => {
  await page.goto('/?case=ready');
  await page.getByLabel('Seu e-mail').fill('teste@example.invalid');
  await page.getByRole('button', { name: 'Enviar código' }).click();
  await page.getByLabel('Código de acesso').fill('00000000');
  await page.getByRole('button', { name: 'Entrar no Jarvis' }).click();
  await expect(page.getByRole('status')).toContainText('Código inválido');
  await expect(page.getByLabel('Código de acesso')).toBeVisible();
});
