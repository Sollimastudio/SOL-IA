import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
});
test.afterEach(async ({ page }, info) => {
  await page.screenshot({ path: info.outputPath('install.png'), fullPage: true });
});
const guide = (page: Page) => page.locator('.install-guide > summary');

test('installation is visible before login and does not request a code', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/**', route => { calls++; return route.abort(); });
  await page.goto('/');
  await expect(guide(page)).toBeVisible();
  await guide(page).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.install-instructions')).toBeVisible();
  expect(calls).toBe(0);
  expect((await guide(page).boundingBox())!.height).toBeGreaterThanOrEqual(44);
});

test('iPhone guide works without native install API and preserves the conversation draft', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla iPhone Safari' }));
  await page.goto('/?case=chat');
  await page.locator('#jarvis-message').fill('Meu rascunho continua aqui');
  await guide(page).click();
  await expect(page.locator('.install-instructions')).toContainText('Adicionar à Tela de Início');
  await expect(page.locator('.install-instructions')).toContainText('quadrado com a seta para cima');
  await expect(page.getByRole('button', { name: 'Instalar Jarvis', exact: true })).toHaveCount(0);
  await guide(page).click();
  await expect(page.locator('#jarvis-message')).toHaveValue('Meu rascunho continua aqui');
  await expect(page.getByText('MIC OFF', { exact: true })).toBeVisible();
});

test('iPad desktop user agent receives iOS instructions', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla Macintosh Safari' });
    Object.defineProperty(navigator, 'platform', { configurable: true, value: 'MacIntel' });
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 });
  });
  await page.goto('/'); await guide(page).click();
  await expect(page.locator('.install-instructions')).toContainText('Abrir como App da Web');
});

test('standalone launch shows its real display state instead of offering installation again', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'standalone', { configurable: true, value: true }));
  await page.goto('/?case=chat');
  await expect(page.getByText('Aberto pelo ícone do Jarvis', { exact: true })).toBeVisible();
  await expect(guide(page)).toHaveCount(0);
  await expect(page.locator('#jarvis-message')).toBeEnabled();
});

async function offer(page: Page, outcome: 'accepted' | 'dismissed' | 'error') {
  await expect(guide(page)).toBeVisible();
  await page.evaluate(outcome => {
    const w = window as any;
    w.__installCalls = 0;
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt() { w.__installCalls++; return outcome === 'error' ? Promise.reject(new Error('Synthetic denial')) : Promise.resolve(); },
      userChoice: Promise.resolve({ outcome })
    });
    window.dispatchEvent(event);
  }, outcome);
  await guide(page).click();
  await expect(page.getByRole('button', { name: 'Instalar Jarvis', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__installCalls)).toBe(0);
  await page.getByRole('button', { name: 'Instalar Jarvis', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__installCalls)).toBe(1);
}

test('native install is user initiated, single use, and dismissal does not log out', async ({ page }) => {
  await page.goto('/?case=chat');
  await offer(page, 'dismissed');
  await expect(page.getByRole('status', { name: 'Instalação do Jarvis' })).toContainText('Você pode instalar depois');
  await expect(page.getByRole('button', { name: 'Instalar Jarvis', exact: true })).toHaveCount(0);
  await expect(page.locator('#jarvis-message')).toBeEnabled();
});

test('accepting a prompt is not confused with confirmed installation', async ({ page }) => {
  await page.goto('/?case=chat');
  await offer(page, 'accepted');
  await expect(page.getByRole('status', { name: 'Instalação do Jarvis' })).toContainText('Pedido aceito pelo navegador');
  await expect(page.getByText(/Instalação confirmada pelo navegador/)).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(page.getByRole('status', { name: 'Instalação do Jarvis' })).toContainText('Instalação confirmada pelo navegador');
  await expect(guide(page)).toHaveCount(0);
});

test('failed native prompt leaves manual instructions and draft available', async ({ page }) => {
  await page.goto('/?case=chat');
  await page.locator('#jarvis-message').fill('Não perder esta ideia');
  await offer(page, 'error');
  await expect(page.getByRole('status', { name: 'Instalação do Jarvis' })).toContainText('O navegador não abriu a instalação');
  await expect(page.locator('.install-instructions ol')).toBeVisible();
  await expect(page.locator('#jarvis-message')).toHaveValue('Não perder esta ideia');
});

test('installation guide fits a 320px viewport and serves real icon assets', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/'); await guide(page).click();
  const box = (await page.locator('.install-guide').boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(320);
  expect(await page.locator('.install-guide').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  expect(await page.locator('.install-guide img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 192)).toBe(true);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
});
