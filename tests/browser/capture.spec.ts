import { test, expect } from '@playwright/test';

test('zero budget saves only through capture and preserves the draft on failure', async ({page}) => {
  let aiCalls=0; const bodies:any[]=[];
  await page.route('**/api/jarvis-chat',route=>{aiCalls++;return route.abort();});
  await page.route('**/api/jarvis-capture',async route=>{
    const body=route.request().postDataJSON(); bodies.push(body);
    await route.fulfill({status:bodies.length===1?503:200,contentType:'application/json',body:JSON.stringify(bodies.length===1
      ? {ok:false,persisted:null,error:'Salvamento não confirmado.'}
      : {ok:true,persisted:true,memoryId:body.captureId,execution:'capture_only',
          receipt:'Fala confirmada no cofre. Nenhum modelo de IA foi chamado.',continuityPersisted:true,
          continuity:{relation:'new_topic',scope:'exploration',topicHint:'projeto fictício'}})});
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
  await expect(page.getByRole('status').filter({hasText:'Salvo no cofre e registrado no Diário de Continuidade.'})).toBeVisible();
  const receipt=page.getByRole('article',{name:'Resultado do registro no Jarvis'});
  await expect(receipt).toContainText('JARVIS · REGISTRO CONFIRMADO');
  await expect(receipt).toContainText('Assunto reconhecido: projeto fictício');
  await expect(receipt).toContainText('novo assunto');
  await expect(receipt).toContainText('reflexão / exploração');
  await expect(receipt).toContainText('diário atualizado');
  await expect(receipt).toContainText('Uma resposta inteligente sobre o conteúdo não foi gerada');
  expect(bodies).toHaveLength(2); expect(bodies[0].captureId).toBe(bodies[1].captureId);
  expect(bodies[0].message).toBe('  Meu projeto fictício\ncontinua aqui.  ');
  expect(aiCalls).toBe(0);
  await expect(page.getByRole('button',{name:'MODO PERFORMANCE',exact:true})).toHaveCount(0);
  await page.screenshot({path:test.info().outputPath('capture-zero-budget.png'),fullPage:true});
});

test('voice status never hides a confirmed vault receipt', async ({page}) => {
  await page.route('**/api/jarvis-capture',async route=>{
    const body=route.request().postDataJSON();
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,persisted:true,
      memoryId:body.captureId,execution:'capture_only',receipt:'Fala confirmada no cofre.',continuityPersisted:true,
      continuity:{relation:'detail',scope:'raw_statement',topicHint:'continuidade'}})});
  });
  await page.goto('/?case=chat&budget=zero');
  const input=page.getByLabel('Sua ideia ou anotação');
  await input.fill('Continuar este assunto.');
  await page.getByRole('button',{name:'GUARDAR NO COFRE',exact:true}).click();
  const receipt=page.getByRole('article',{name:'Resultado do registro no Jarvis'});
  await expect(receipt).toContainText('Fala confirmada no cofre.');
  await page.getByRole('button',{name:'Parar voz',exact:true}).click();
  await expect(receipt).toContainText('Fala confirmada no cofre.');
  await expect(page.getByText('Leitura interrompida.')).toBeVisible();
});

test('zero budget never accepts a fake or unrelated storage receipt', async ({page}) => {
  await page.route('**/api/jarvis-capture',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,persisted:true,memoryId:'wrong',execution:'capture_only'})}));
  await page.goto('/?case=chat&budget=zero');
  await page.getByLabel('Sua ideia ou anotação').fill('Não apagar sem comprovação');
  await page.getByRole('button',{name:'GUARDAR NO COFRE',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Salvamento não confirmado.'})).toBeVisible();
  await expect(page.getByLabel('Sua ideia ou anotação')).toHaveValue('Não apagar sem comprovação');
});
