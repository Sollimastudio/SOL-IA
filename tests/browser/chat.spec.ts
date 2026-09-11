import { test, expect } from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
});
test.afterEach(async ({page},info) => { await page.screenshot({path:info.outputPath('chat.png'),fullPage:true}); });
const success = {ok:true,answer:'Olá, Sol. Qual ideia vamos organizar?',modelUsed:'alibaba/qwen3.8-flash',specialist:'jarvis_executive',persisted:false,warnings:[]};
async function send(page: any, text = 'Oi') {
  await page.locator('#jarvis-message').fill(text);
  await page.getByRole('button',{name:'ENVIAR',exact:true}).click();
}
test('authenticated chat renders a provider response and the actual selected model',async ({page}) => {
  await page.route('**/api/jarvis-chat', route => route.fulfill({json:success}));
  await page.goto('/?case=chat');
  await expect(page.getByText('CONTA CONECTADA',{exact:true})).toBeVisible();
  await expect(page.getByText('JARVIS ONLINE',{exact:true})).toHaveCount(0);
  await send(page);
  await expect(page.getByRole('log')).toContainText(success.answer);
  await expect(page.getByRole('log')).toContainText('alibaba/qwen3.8-flash');
  await expect(page.locator('#jarvis-message')).toBeEnabled();
});
test('provider refusal is visibly a system error and is never sent as assistant history',async ({page}) => {
  let attempts = 0; let lastBody: any;
  await page.route('**/api/jarvis-chat',route => {
    attempts++; lastBody=route.request().postDataJSON();
    return route.fulfill(attempts===1 ? {status:502,json:{ok:false,error:'Recusa de provedor sintética',persisted:true}} : {json:success});
  });
  await page.goto('/?case=chat'); await send(page);
  await expect(page.getByRole('log')).toContainText('AVISO DO SISTEMA');
  await expect(page.getByRole('log')).toContainText('Fala confirmada no cofre');
  await send(page,'Organize uma ideia');
  await expect(page.getByRole('log')).toContainText(success.answer);
  expect(JSON.stringify(lastBody.history)).not.toContain('Recusa de provedor');
  await expect(page.getByRole('heading',{name:'Entrar no Jarvis'})).toHaveCount(0);
});
test('hiding the mobile page stops voice hardware without aborting an in-flight text response',async ({page}) => {
  let release: (()=>void)|undefined;
  const ready = new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/api/jarvis-chat',async route => { await ready; await route.fulfill({json:success}); });
  await page.goto('/?case=chat'); await send(page);
  await expect(page.getByText('consultando o núcleo seguro…')).toBeVisible();
  await page.evaluate(()=>{
    Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  release?.();
  await expect(page.getByRole('log')).toContainText(success.answer);
  await page.evaluate(()=>{
    Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'visible'});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('#jarvis-message')).toBeEnabled();
  await expect(page.getByText('MIC OFF',{exact:true})).toBeVisible();
});
test('host login HTML is not mistaken for an AI response or a Supabase logout',async ({page}) => {
  await page.route('**/api/jarvis-chat',route=>route.fulfill({contentType:'text/html',body:'<html>Sign in</html>'}));
  await page.goto('/?case=chat'); await send(page);
  await expect(page.getByRole('log')).toContainText('A hospedagem devolveu uma página de acesso');
  await expect(page.locator('#jarvis-message')).toBeEnabled();
});
test('switching public/private mode drops late private responses',async ({page}) => {
  let release: (()=>void)|undefined;
  const ready=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/api/jarvis-chat',async route=>{await ready; try{await route.fulfill({json:success});}catch{/* aborted deliberately */}});
  await page.goto('/?case=chat'); await send(page);
  await expect(page.getByText('consultando o núcleo seguro…')).toBeVisible();
  await page.getByRole('button',{name:'MODO PERFORMANCE',exact:true}).click(); release?.();
  await expect(page.getByRole('log')).not.toContainText(success.answer);
  await expect(page.locator('#jarvis-message')).toBeEnabled();
});

test('one explicit voice-start gesture handles Jarvis and routes a response to Brazilian speech',async ({page})=>{
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
  await page.getByRole('button',{name:'Iniciar voz',exact:true}).click();
  await expect(page.getByLabel('Autorizar microfone nesta sessão')).toBeChecked();
  await expect(page.getByRole('log')).toContainText(success.answer);
  await expect.poll(()=>page.evaluate(()=>(window as any).__spoken)).toEqual({text:success.answer,lang:'pt-BR',voice:'Felipe'});
  await page.getByRole('button',{name:'ENCERRAR / MIC OFF'}).click();
  await expect(page.getByText('MIC OFF',{exact:true})).toBeVisible();
});
