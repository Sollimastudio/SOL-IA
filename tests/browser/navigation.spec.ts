import { test, expect } from '@playwright/test';

test('zero-budget Jarvis keeps conversation as home and exposes simple drawers', async ({ page }) => {
  await page.goto('/?case=chat&budget=zero');
  const nav = page.getByRole('navigation', { name: 'Menu principal do Jarvis' });
  await expect(nav.getByRole('button', { name: 'CONVERSAR', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { name: 'Guardar sem chamar IA' })).toBeVisible();

  await nav.getByRole('button', { name: 'CONHECIMENTO', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'conhecimento' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'VOLTAR PARA CONVERSAR', exact: true })).toBeVisible();

  await nav.getByRole('button', { name: 'COFRE', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'cofre' })).toBeVisible();
  await expect(page.getByText('Memorias recentes')).toBeVisible();

  await nav.getByRole('button', { name: 'INTEGRAÇÕES', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'integrações' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Integrações' })).toBeVisible();
  await expect(page.getByText('n8n', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'VOLTAR PARA CONVERSAR', exact: true }).click();
  await expect(nav.getByRole('button', { name: 'CONVERSAR', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { name: 'Guardar sem chamar IA' })).toBeVisible();
});
