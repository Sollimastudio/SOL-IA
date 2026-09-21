import { test, expect } from '@playwright/test';
import { createSeriesState, parseBrief, validatePlan, validateEpisode } from '../../core/reference-series.mjs';
import { referencePacket } from '../../server/reference-acquisition.mjs';
import { brief, plan, episode } from '../fixtures/reference-series.mjs';

test('private pasted link creates once, resumes three saved scripts and requires approval before delivery', async ({page}, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const state = createSeriesState(parseBrief(brief)); state.reference = referencePacket({text:brief.source.text,title:'Fonte de teste',method:'synthetic_fixture',temporal:true}); state.plan = validatePlan(plan(),state);
  let job: any, creates = 0, advances = 0, deliveries = 0;
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.route('**/api/jarvis-knowledge**', route => route.fulfill({json:{ok:true,sources:[],documents:[],items:[]}}));
  await page.route('**/api/jarvis-references**', async route => {
    const req = route.request(), url = new URL(req.url());
    if (req.method() === 'GET') return route.fulfill({json: url.searchParams.has('id') ? {ok:true,job} : {ok:true,jobs:job ? [{id:job.id,title:job.state.brief.title,status:job.state.status,generated:job.state.episodes.length,count:9}] : []}});
    const b = req.postDataJSON(); expect(b.mode).toBe('private');
    if (b.action === 'create') {
      creates++; job = {id:b.id,revision:0,busy:false,lease_until:null,state:structuredClone(state)};
      for(let i=1;i<=3;i++) job.state.episodes.push(validateEpisode(episode(i),job.state,b.id,i));
      job.state.status='drafting'; job.state.nextStep='episode:4';
    }
    if (b.action === 'advance') { advances++; expect(b.revision).toBe(job.revision); const n=job.state.episodes.length+1; job.state.episodes.push(validateEpisode(episode(n),job.state,job.id,n)); job.revision++; job.state.status=n===9?'review':'drafting'; job.state.nextStep=n===9?null:`episode:${n+1}`; }
    if (b.action === 'approve') { expect(b.reviewed).toBe(true); expect(b.access).toBe('free'); job.state.status='approved'; job.revision++; }
    if (b.action === 'deliver') { deliveries++; job.state.status='delivered'; job.state.delivery={episodeCount:9}; job.revision++; }
    return route.fulfill({json:{ok:true,job}});
  });
  await page.goto('/?case=chat'); await expect(page.getByText('SESSÃO LOCAL',{exact:true})).toBeVisible();
  await page.locator('#jarvis-message').fill('Entenda https://example.com/reference e crie nove roteiros');
  await page.getByRole('button',{name:'ENVIAR',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Da referência à sua série'})).toBeVisible();
  await expect(page.locator('.reference-episode')).toHaveCount(9); expect(creates).toBe(1); expect(advances).toBe(6); expect(deliveries).toBe(0);
  const approve=page.getByRole('button',{name:'Revisei e aprovo estes roteiros'}); await expect(approve).toBeDisabled();
  await page.getByLabel('Acesso',{exact:true}).selectOption('free'); await approve.click(); expect(deliveries).toBe(0);
  await page.getByRole('button',{name:'Disponibilizar a versão aprovada para a Lúcida'}).click();
  await expect(page.getByText('A Lúcida confirmou o recebimento de 9 episódios.',{exact:false})).toBeVisible(); expect(deliveries).toBe(1);
  await page.screenshot({path:info.outputPath('reference-series.png'),fullPage:true}); expect(errors).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
