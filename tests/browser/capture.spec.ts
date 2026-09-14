import { test, expect } from '@playwright/test';

test('zero-budget beta keeps chat home and saves private speech through capture fallback', async ({ page }) => {
  let chatCalls = 0;
  const captures: any[] = [];
  await page.route('**/api/jarvis-chat', route => {
    chatCalls++;
    return route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, errorCode: 'ai_budget_paused', stage: 'budget', persisted: false })
    });
  });
  await page.route('**/api/jarvis-capture', async route => {
    const body = route.request().postDataJSON();
    captures.push(body);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        persisted: true,
        memoryId: body.captureId,
        execution: 'capture_only',
        receipt: 'Fala confirmada no cofre. Nenhum modelo de IA foi chamado.',
        continuityPersisted: true,
        continuity: { relation: 'new_topic', scope: 'exploration', topicHint: 'ideia beta' }
      })
    });
  });

  await page.goto('/?case=chat&budget=zero');
  await expect(page.getByRole('heading', { name: 'JARVIS', exact: true })).toBeVisible();
  const input = page.locator('#jarvis-message');
  await input.fill('Estou aqui pensando sobre uma ideia importante para meu projeto.');
  await page.getByRole('button', { name: 'ENVIAR', exact: true }).click();

  const log = page.getByRole('log', { name: 'Conversa' });
  await expect(log).toContainText('Estou aqui pensando sobre uma ideia importante para meu projeto.');
  await expect(log).toContainText('sua fala foi guardada no cofre e no Diário');
  await expect(log).toContainText('Modelo: none');
  await expect(page.getByRole('status')).toContainText('Fala confirmada no cofre.');
  expect(chatCalls).toBe(1);
  expect(captures).toHaveLength(1);
  expect(captures[0].message).toBe('Estou aqui pensando sobre uma ideia importante para meu projeto.');
  expect(captures[0].mode).toBe('private');
  expect(captures[0].remember).toBe(true);
  expect(captures[0].history).toEqual([]);
});

test('public mode never falls back into private capture when budget is paused', async ({ page }) => {
  let captures = 0;
  await page.route('**/api/jarvis-chat', route => route.fulfill({
    status: 403,
    contentType: 'application/json',
    body: JSON.stringify({ ok: false, errorCode: 'ai_budget_paused', stage: 'budget', persisted: false,
      error: 'Geração de IA paga continua bloqueada. Nenhuma fala pública foi enviada ao cofre privado.' })
  }));
  await page.route('**/api/jarvis-capture', route => { captures++; return route.abort(); });

  await page.goto('/?case=chat&budget=zero');
  await page.getByRole('button', { name: 'MODO PERFORMANCE', exact: true }).click();
  const input = page.locator('#jarvis-message');
  await input.fill('Mensagem pública de teste.');
  await page.getByRole('button', { name: 'ENVIAR', exact: true }).click();
  const log = page.getByRole('log', { name: 'Conversa' });
  await expect(log).toContainText('Geração de IA paga continua bloqueada.');
  await expect(log).toContainText('Fala não salva no cofre.');
  expect(captures).toBe(0);
});
