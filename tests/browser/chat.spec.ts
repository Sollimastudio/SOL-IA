import { test, expect } from '@playwright/test';

const success={ok:true,answer:'Resposta sintética do Jarvis.',specialist:'jarvis_executive',persisted:true,memoryId:'memory-1',mode:'private',modelUsed:'synthetic-model',warnings:[]};

test('server access outage preserves unsent draft and does not invent a saved memory or logout',async ({page})=>{
  await page.route('**/api/jarvis-chat',route=>route.fulfill({status:503,json:{ok:false,stage:'access',errorCode:'auth_unavailable',persisted:false,error:'A verificação da sessão está indisponível; isso não confirma que seu login expirou.'}}));
  await page.goto('/?case=chat');
  await page.locator('#jarvis-message').fill('rascunho importante');
  await page.getByRole('button',{name:'ENVIAR',exact:true}).click();
  await expect(page.locator('#jarvis-message')).toHaveValue('rascunho importante');
  await expect(page.getByRole('log')).toContainText('A verificação da sessão está indisponível');
  await expect(page.getByRole('log')).not.toContainText('Fala confirmada no cofre.');
});

test('explicit pre-write invalid token renews once without asking for an email code',async ({page})=>{
  let calls=0;
  await page.route('**/api/jarvis-chat',route=>{
    calls++;
    return route.fulfill(calls===1?{status:401,json:{ok:false,stage:'access',errorCode:'session_invalid',persisted:false,error:'Sessão recusada pelo servidor.'}}:{json:success});
  });
  await page.goto('/?case=refresh');
  await page.locator('#jarvis-message').fill('continue');
  await page.getByRole('button',{name:'ENVIAR',exact:true}).click();
  await expect(page.getByRole('log')).toContainText(success.answer);
  expect(calls).toBe(2);
});

test('unknown persistence is not falsely described as unsaved and is not replayed',async ({page})=>{
  await page.route('**/api/jarvis-chat',route=>route.fulfill({status:502,json:{ok:false,error:'Falha de transporte.',persisted:null}}));
  await page.goto('/?case=chat');
  await page.locator('#jarvis-message').fill('ideia única');
  await page.getByRole('button',{name:'ENVIAR',exact:true}).click();
  await expect(page.getByRole('log')).toContainText('Gravação não confirmada');
  await expect(page.getByRole('log')).not.toContainText('Fala não salva no cofre.');
});

test('authenticated chat renders a provider response and the actual selected model',async ({page})=>{
  await page.route('**/api/jarvis-chat',route=>route.fulfill({json:success}));
  await page.goto('/?case=chat');
  await page.locator('#jarvis-message').fill('teste');
  await page.getByRole('button',{name:'ENVIAR',exact:true}).click();
  await expect(page.getByRole('log')).toContainText(success.answer);
  await expect(page.getByRole('log')).toContainText('Modelo: synthetic-model');
});

test('provider refusal is visibly a system error and is never sent as assistant history',async ({page})=>{
  const bodies:any[]=[];
  await page.route('**/api/jarvis-chat',async route=>{
    bodies.push(route.request().postDataJSON());
    if(bodies.length===1) return route.fulfill({status:502,json:{ok:false,error:'O provedor recusou esta geração.',errorCode:'provider_refusal',persisted:false}});
    return route.fulfill({json:success});
  });
  await page.goto('/?case=chat');
  await page.locator('#jarvis-message').fill('primeiro');
  await page.getByRole('button',{name:'ENVIAR',exact:true}).click();
  await expect(page.getByRole('log')).toContainText('AVISO DO SISTEMA');
  await page.locator('#jarvis-message').fill('segundo');
  await page.getByRole('button',{name:'ENVIAR',exact:true}).click();
  expect(JSON.stringify(bodies[1].history)).not.toContain('O provedor recusou esta geração.');
});

test('hiding the mobile page stops voice hardware without aborting an in-flight text response',async ({page})=>{
  let release:undefined|(()=>void);
  await page.route('**/api/jarvis-chat',route=>new Promise<void>(resolve=>{release=()=>{void route.fulfill({json:success}).then(()=>resolve());};}));
  await page.goto('/?case=chat');
  await page.locator('#jarvis-message').fill('texto em andamento');
  await page.getByRole('button',{name:'ENVIAR',exact:true}).click();
  await expect(page.getByText('consultando o núcleo seguro…')).toBeVisible();
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  release?.();
  await expect(page.getByRole('log')).toContainText(success.answer);
});

test('host login HTML is not mistaken for an AI response or a Supabase logout',async ({page})=>{
  await page.route('**/api/jarvis-chat',route=>route.fulfill({status:401,contentType:'text/html',body:'<html>host login</html>'}));
  await page.goto('/?case=chat');
  await page.locator('#jarvis-message').fill('teste');
  await page.getByRole('button',{name:'ENVIAR',exact:true}).click();
  await expect(page.getByRole('log')).toContainText('hospedagem devolveu uma página de acesso');
});

test('switching public/private mode drops late private responses',async ({page})=>{
  let release:undefined|(()=>void);
  await page.route('**/api/jarvis-chat',route=>new Promise<void>(resolve=>{release=()=>{void route.fulfill({json:success}).then(()=>resolve());};}));
  await page.goto('/?case=chat');
  await page.locator('#jarvis-message').fill('segredo privado');
  await page.getByRole('button',{name:'ENVIAR',exact:true}).click();
  await expect(page.getByText('consultando o núcleo seguro…')).toBeVisible();
  await page.getByRole('button',{name:'MODO PERFORMANCE',exact:true}).click(); release?.();
  await expect(page.getByRole('log')).not.toContainText(success.answer);
  await expect(page.locator('#jarvis-message')).toBeEnabled();
});

test('one explicit voice-start gesture accepts direct speech and can route an optional response to Brazilian speech',async ({page})=>{
  await page.addInitScript(()=>{
    const w=window as any;
    let emitted=false;
    w.SpeechRecognition=class {
      onresult:any=null; onend:any=null; onerror:any=null;
      start(){ if(!emitted){emitted=true;setTimeout(()=>this.onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:'Jarvis, oi'}}]}),50);} }
      abort(){}
    };
    w.SpeechSynthesisUtterance=class { text:string; constructor(text:string){this.text=text;} };
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{
      cancel(){},getVoices(){return [{lang:'pt-BR',name:'Female voice'},{lang:'pt-BR',name:'Felipe'}];},
      speak(speech:any){w.__spoken={text:speech.text,lang:speech.lang,voice:speech.voice?.name};setTimeout(()=>speech.onend?.(),10);}
    }});
  });
  await page.route('**/api/jarvis-chat',route=>route.fulfill({json:success}));
  await page.goto('/?case=chat');
  await page.getByLabel('Ouvir resposta com a voz do aparelho (opcional)').check();
  await page.getByRole('button',{name:'Falar agora',exact:true}).click();
  await expect(page.getByLabel('Autorizar microfone nesta sessão')).toBeChecked();
  await expect(page.getByRole('log')).toContainText(success.answer);
  await expect.poll(()=>page.evaluate(()=>(window as any).__spoken)).toEqual({text:success.answer,lang:'pt-BR',voice:'Felipe'});
  await page.getByRole('button',{name:'ENCERRAR / MIC OFF'}).click();
  await expect(page.getByText('MIC OFF',{exact:true})).toBeVisible();
});
