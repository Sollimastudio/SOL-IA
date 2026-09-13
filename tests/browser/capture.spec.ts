import { test, expect } from '@playwright/test';

test('zero budget saves only through capture and preserves the draft on failure', async ({page}) => {
  let aiCalls=0; const bodies:any[]=[];
  await page.route('**/api/jarvis-chat',route=>{aiCalls++;return route.abort();});
  await page.route('**/api/jarvis-capture',async route=>{
    const body=route.request().postDataJSON(); bodies.push(body);
    await route.fulfill({status:bodies.length===1?503:200,contentType:'application/json',body:JSON.stringify(bodies.length===1
      ? {ok:false,persisted:null,error:'Salvamento não confirmado.'}
      : {ok:true,persisted:true,memoryId:body.captureId,execution:'capture_only'})});
  });
  await page.goto('/?case=chat&budget=zero');
  await expect(page.getByRole('heading',{name:'Guardar sem chamar IA'})).toBeVisible();
  const input=page.getByLabel('Sua ideia ou anotação');
  await input.fill('  Meu projeto fictício\ncontinua aqui.  ');
  await page.getByRole('button',{name:'GUARDAR NO COFRE',exact:true}).click();
  await expect(input).toHaveValue('  Meu projeto fictício\ncontinua aqui.  ');
  await expect(page.getByRole('status').filter({hasText:'Salvamento não confirmado.'})).toBeVisible();
  await page.getByRole('button',{name:'GUARDAR NO COFRE',exact:true}).click();
  await expect(input).toHaveValue('');
  await expect(page.getByRole('status').filter({hasText:'Ideia confirmada'})).toBeVisible();
  expect(bodies).toHaveLength(2); expect(bodies[0].captureId).toBe(bodies[1].captureId);
  expect(bodies[0].message).toBe('  Meu projeto fictício\ncontinua aqui.  ');
  expect(aiCalls).toBe(0);
  await expect(page.getByRole('button',{name:'MODO PERFORMANCE',exact:true})).toHaveCount(0);
  await page.screenshot({path:test.info().outputPath('capture-zero-budget.png'),fullPage:true});
});
test('zero budget never accepts a fake or unrelated storage receipt', async ({page}) => {
  await page.route('**/api/jarvis-capture',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,persisted:true,memoryId:'wrong',execution:'capture_only'})}));
  await page.goto('/?case=chat&budget=zero');
  await page.getByLabel('Sua ideia ou anotação').fill('Não apagar sem comprovação');
  await page.getByRole('button',{name:'GUARDAR NO COFRE',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Salvamento não confirmado.'})).toBeVisible();
  await expect(page.getByLabel('Sua ideia ou anotação')).toHaveValue('Não apagar sem comprovação');
});
