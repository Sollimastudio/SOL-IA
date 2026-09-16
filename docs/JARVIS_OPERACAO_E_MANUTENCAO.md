# Jarvis — Operação e manutenção

> **Runbook técnico.** Atualizado em 16/09/2026. Orienta manutenção, evolução, testes, deploy, segurança, multiusuário e investigação de falhas sem depender de memória de conversa.

## 1. Repositório e continuidade de desenvolvimento

Repositório canônico:

`Sollimastudio/SOL-IA`

Antes de qualquer mudança:

1. consultar HEAD/PR/branch ativos reais;
2. ler `docs/JARVIS_INDICE_DOCUMENTACAO.md`;
3. ler `docs/CONTINUIDADE_JARVIS.md`;
4. ler a arquitetura especializada relevante;
5. comparar requisito com estado atual;
6. trabalhar no delta;
7. não abrir novo repositório sem decisão explícita de governança.

Não hardcodar em documentação operacional uma branch antiga como se continuasse eternamente ativa. O ciclo atual de GPT-Live/personalização usa `work/jarvis-gpt-live-1-20260916`, derivado da linha anterior de continuidade.

## 2. Componentes principais

- `src/` — frontend React/Vite e experiência web;
- `api/` — handlers server-side;
- `server/` — runtime, chat, anti-fadiga, políticas e adaptadores;
- `core/` — inteligência/políticas compartilhadas;
- `supabase/migrations/` — banco versionado;
- `ios/JarvisNative/` — cliente nativo iOS;
- `local_studio/` — processamento local autorizado;
- `tests/` — contratos automatizados;
- `config/` — fontes/configuração versionada;
- `docs/` — documentação canônica.

## 3. Ambientes

### Desenvolvimento/branch

Mudanças isoladas e testes.

### Preview Vercel

Validação antes de produção. READY não significa automaticamente “provado no aparelho”.

### Produção/main

Promoção exige gates compatíveis com risco.

### Supabase real

DDL deve usar migração versionada. Alteração que afeta segurança, RLS ou dados exige teste compatível e revisão.

### Futuro multi-tenant

Nunca testar isolamento apenas com um usuário. Antes de operação comercial, criar fixtures/ambientes com no mínimo dois tenants e múltiplos roles.

## 4. Comandos básicos

```bash
npm install
npm test
npm run build
```

O `prebuild` executa contratos Node antes do build da Preview.

## 5. Gates de qualidade

### Gate A — contratos Node

Domínio, privacidade, Core, integrações, voz.

### Gate B — TypeScript/build

Frontend/API compilam.

### Gate C — banco

Migrações e políticas testadas.

### Gate D — browser

Login, UI, retry, captura e fluxos web.

### Gate E — Preview

Deployment pronto e comportamento verificável.

### Gate F — prova física/externa

Obrigatório para:

- iPhone/Mac/Xcode;
- microfone/câmera;
- wake word;
- tela bloqueada;
- AirPods;
- live/mixagem;
- conta social real;
- APIs externas cujo comportamento não pode ser simulado.

### Gate G — isolamento multi-tenant

Obrigatório antes de vender para múltiplos clientes:

- Tenant A não lê Tenant B;
- prompts maliciosos não atravessam escopo;
- busca/cache/embeddings respeitam tenant;
- jobs/filas mantêm contexto correto;
- conectores usam credencial correta;
- roles restringem ações;
- export/delete/restore são isolados;
- logs não misturam conteúdo.

## 6. Segurança e segredos

Nunca colocar em frontend/PWA/app nativo:

- `service_role`;
- chave privada de IA;
- token permanente de rede social;
- segredo OAuth;
- credencial administrativa.

Regras gerais:

- Auth antes de dado privado;
- RLS/autorização por escopo;
- `owner_id` no piloto pessoal;
- `tenant_id/workspace_id/client_id` quando a arquitetura comercial exigir;
- segredo por tenant/conector;
- modo público sem Cofre privado;
- logs mínimos;
- erros redigidos;
- voz não é autorização suficiente para ação sensível.

Não adicionar `tenant_id` como decoração: revisar query, policy, índice, cache, worker, busca semântica e API.

## 7. Memória e continuidade

Ao alterar memória:

- preservar entrada original;
- não fundir ambiguidade irreversivelmente;
- correção cria versão;
- resposta da IA fica separada;
- fonte importada não vira Perfil DNA automaticamente;
- recuperação respeita owner/tenant/workspace;
- idempotência não duplica silenciosamente;
- promoção de memória privada para compartilhada exige regra/autorização.

## 8. Perfil DNA e configuração

Toda regra/profile claim deve carregar escopo.

No piloto Sol existem claims pessoais/autoriais. No produto genérico, claims podem representar marca, KPI, política, processo, preferência, role etc.

Conta nova nunca herda `Sol Profile Pack`.

## 9. Custos

Política: não criar gasto silencioso.

Quando modelo/ferramenta pago entra:

- registrar modelo/ferramenta;
- finalidade;
- tenant/workspace/projeto;
- custo;
- limite/orçamento;
- fallback;
- autorização.

GPT-Live deve encerrar corretamente e expor uso/custo quando o provedor fornece confirmação.

No multi-tenant, custo precisa ser atribuível para evitar que um cliente subsidie outro sem intenção.

## 10. Conectores

Princípios:

1. leitura antes de escrita quando possível;
2. OAuth/app authorization preferível a token manual;
3. escopo mínimo;
4. proveniência;
5. credencial vinculada ao tenant correto;
6. escrita auditável;
7. ação irreversível com política/confirmação;
8. comprovante de execução.

Agência com dez clientes significa dez contextos isolados, não um token “mágico” com acesso indistinto.

## 11. GitHub

Separar:

- ChatGPT/Codex usando GitHub para desenvolvimento;
- Jarvis lendo GitHub como fonte;
- Jarvis propondo patch;
- Jarvis escrevendo branch/PR;
- Jarvis promovendo produção.

Esses níveis têm permissões/gates diferentes.

## 12. Cliente nativo iOS

Local:

`ios/JarvisNative/`

Sequência de prova:

1. gerar/compilar no Mac;
2. corrigir erro de SDK;
3. assinar;
4. instalar;
5. login;
6. diagnóstico;
7. configurar Atalho Vocal;
8. testar hands-free;
9. testar tela bloqueada separadamente.

Não declarar wake word/background antes de prova real.

## 13. GPT-Live / realtime

O branch atual possui implementação de token broker, captura de áudio, sessão full-duplex, transcrição, vozes, custo e delegação.

Antes de promoção:

- rodar contratos/build;
- validar Preview;
- testar microfone/fala/interrupção em aparelho real;
- confirmar encerramento/custo;
- testar perda de rede/reconexão;
- confirmar que chave privada não chega ao cliente;
- preservar fallback antigo.

## 14. Incidente: Jarvis não responde

Investigar em ordem:

1. identidade/sessão;
2. tenant/workspace/role;
3. autorização piloto/feature flag;
4. modelo/runtime;
5. memória/contexto;
6. conector/ferramenta;
7. transporte/API;
8. frontend/estado;
9. TTS/realtime;
10. plataforma externa;
11. limite/custo.

Não mascarar falha pedindo login repetidamente.

## 15. Incidente: “ele esqueceu”

Verificar:

- foi salvo?
- em qual escopo?
- existe versão/supersessão?
- a busca consultou o tenant/workspace correto?
- fonte foi importada?
- contexto chegou ao modelo?
- informação estava apenas em conversa externa e nunca entrou no Jarvis?

Não resolver esquecimento copiando indiscriminadamente tudo para Perfil DNA.

## 16. Incidente multi-tenant: contexto errado

Tratar como incidente de alta gravidade.

Ações:

1. bloquear fluxo afetado;
2. identificar query/cache/job responsável;
3. não ocultar o incidente por “ajuste de prompt”;
4. corrigir autorização/escopo na camada de dados/ferramenta;
5. adicionar teste de regressão;
6. revisar logs/auditoria compatíveis;
7. seguir política de resposta a incidente quando houver clientes reais.

Prompt não é fronteira de segurança.

## 17. Self-healing

```text
feedback/log
→ issue/tarefa
→ reprodução
→ branch isolada
→ patch
→ testes
→ Preview
→ evidência
→ aprovação/política
→ promoção
→ rollback
```

Self-healing pode automatizar diagnóstico/patch/teste, mas produção continua protegida por gates.

Mudança aprendida com um tenant não deve virar mudança global sem processo de produto.

## 18. Radares

### Capability Radar

Tecnologia/fornecedores do Jarvis.

### Domain Radar

Mercado/tendências/riscos do tenant.

Toda descoberta deve ter:

- fonte;
- data/frescor;
- impacto;
- escopo;
- custo/risco;
- hipótese de ação;
- evidência de resultado quando executada.

## 19. Documentação como gate

Mudança relevante atualiza pelo menos o documento correspondente:

- `JARVIS_STATUS_CAPACIDADES.md` — maturidade;
- `JARVIS_ARQUITETURA_GERAL.md` — arquitetura;
- `JARVIS_MODO_DE_USO.md` — experiência;
- `ARQUITETURA_MULTIUSUARIO_E_PERSONALIZACAO.md` — tenant/personalização;
- `LOOP_CONTINUO_TENDENCIA_PARA_RECEITA.md` — radar/resultado;
- `CONTINUIDADE_JARVIS.md` — checkpoint técnico importante.

Documentação desatualizada é regressão operacional.

## 20. Critério de manutenção saudável

Uma pessoa técnica ou agente de desenvolvimento deve conseguir entrar, ler documentação, verificar HEAD e continuar sem pedir que o cliente reconte a visão.

E uma conta nova deve conseguir nascer **sem nenhum dado ou comportamento específico da Sol vazando como padrão**.
