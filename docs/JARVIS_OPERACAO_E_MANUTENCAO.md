# Jarvis / Sol.IA — Operação e manutenção

> **Runbook técnico.** Este documento orienta manutenção, evolução, testes, deploy, segurança e investigação de falhas sem depender de memória de conversa.

## 1. Repositório e linha de desenvolvimento

Repositório canônico:

`Sollimastudio/SOL-IA`

Branch ativa deste ciclo:

`work/jarvis-neural-conversa-segura-20260908`

PR ativo:

`#6`

Antes de qualquer mudança:

1. consultar o HEAD real do PR;
2. ler `docs/JARVIS_INDICE_DOCUMENTACAO.md`;
3. ler `docs/CONTINUIDADE_JARVIS.md`;
4. comparar requisito com o estado atual;
5. trabalhar no delta;
6. não abrir novo repositório sem decisão explícita de governança.

## 2. Componentes principais

- `src/` — frontend React/Vite e experiência web.
- `api/` — handlers server-side na Vercel.
- `server/` — runtime, chat, anti-fadiga e adaptadores.
- `core/` — políticas e inteligência de domínio compartilhada.
- `supabase/migrations/` — mudanças de banco versionadas.
- `ios/JarvisNative/` — cliente nativo iOS.
- `local_studio/` — experimentos e processamento local autorizado.
- `tests/` — contratos automatizados.
- `config/` — fontes e configuração versionada, como Capability Radar.
- `docs/` — documentação de produto, arquitetura, continuidade e operação.

## 3. Ambientes

### Desenvolvimento

Usado para alterações locais/branch e testes sem promover produção.

### Preview Vercel

Cada commit no branch pode gerar Preview. A Preview é ambiente de validação, não produção definitiva.

### Produção/main

Não promover automaticamente apenas porque uma Preview construiu. Mudanças de segurança, memória, custo, escrita externa ou aplicativo nativo precisam do gate correspondente.

### Supabase real

Migrações reais só devem ser aplicadas depois de teste compatível. Mudança DDL deve usar migração versionada e ser registrada no repositório.

## 4. Comandos básicos

```bash
npm install
npm test
npm run build
```

O `prebuild` atual executa todos os arquivos `tests/*.test.mjs` antes do build da Vercel.

## 5. Gates de qualidade

Uma entrega pode envolver tipos diferentes de evidência.

### Gate A — contratos Node

Protege regras de domínio, privacidade, voz, Core e integrações.

### Gate B — TypeScript/build

Confirma que frontend/API compilam.

### Gate C — banco

Migrações devem ser testadas em PostgreSQL limpo/ambiente isolado quando relevante. Reaplicação deve ser segura quando a migração foi projetada como idempotente.

### Gate D — browser

Fluxos de login/UI/retry precisam de teste em navegador quando aplicável.

### Gate E — Preview

Deployment deve ficar `READY` após passar contratos/build.

### Gate F — prova física

Obrigatório para coisas que software de CI não pode certificar:

- microfone/câmera reais;
- iPhone;
- Xcode/signing;
- Atalhos Vocais;
- tela bloqueada;
- AirPods;
- live real;
- mixagem de áudio;
- APIs sociais com conta real.

Nunca usar teste estático como substituto de prova física.

## 6. Segurança e segredos

Nunca colocar em frontend, PWA ou app iOS:

- `service_role`;
- chave privada de provedor de IA;
- token permanente de rede social;
- segredo OAuth;
- credencial administrativa.

No web app, usar publishable/anon key apenas para o fluxo permitido por RLS.

No iOS, sessão da usuária deve ficar no Keychain. Segredos de provedor continuam no servidor.

Regras:

- `owner_id` + RLS para dados privados;
- `auth.uid()` como fronteira de leitura/escrita;
- modo público sem Cofre;
- logs sem conteúdo íntimo quando um identificador/contagem basta;
- erros de provedor devem ser classificados e redigidos, sem vazar corpo sensível.

## 7. Memória e continuidade

Ao alterar memória:

- preservar evento original;
- não fundir ambiguidade de forma irreversível;
- correção cria versão/ligação;
- resposta da IA permanece separada;
- fonte importada não vira Perfil DNA;
- recuperação deve respeitar usuário;
- reenvio/idempotência não pode duplicar silenciosamente.

Qualquer mudança nesse núcleo exige testes de regressão de continuidade e isolamento.

## 8. Custos

Política atual: evitar gasto novo não autorizado.

O backend zero-cost deve:

1. consultar catálogo do Gateway;
2. localizar apenas o modelo candidato dedicado;
3. confirmar preço de input = 0;
4. confirmar preço de output = 0;
5. exigir credencial válida;
6. só então habilitar chat;
7. falhar fechado se qualquer verificação não passar.

Não criar fallback pago silencioso.

Quando modelos premium forem ativados futuramente:

- registrar custo por tarefa;
- orçamento/limite;
- finalidade;
- modelo selecionado;
- política de fallback;
- autorização de cobrança.

## 9. Conectores

### Leitura antes de escrita

Todo novo conector deve começar, quando possível, em read-only.

### OAuth

Preferir OAuth/App authorization em vez de pedir token manual à usuária.

### Proveniência

Dados recuperados devem carregar origem suficiente para saber conta, provedor e fonte.

### Escrita

Publicar, enviar mensagem, editar arquivo ou alterar configuração deve ter estado auditável e confirmação conforme risco.

## 10. Integração Google Drive

A infraestrutura OAuth/vault existe, mas conexão multi-conta nativa ainda precisa ser concluída.

Ao implementar:

- conta por autorização separada;
- refresh token em vault/segredo apropriado;
- rótulo da conta;
- escopo mínimo;
- leitura primeiro;
- origem da busca na resposta;
- escrita apenas depois de política explícita.

## 11. GitHub

O GitHub é fonte de código e parte do conhecimento do Jarvis.

Separar:

- ChatGPT/Codex conectado ao GitHub para desenvolvimento;
- Jarvis lendo GitHub como fonte;
- Jarvis propondo patch;
- Jarvis escrevendo em branch/PR.

Esses níveis não são equivalentes e não devem ser declarados prontos por inferência.

## 12. Cliente nativo iOS

Local:

`ios/JarvisNative/`

Arquivos importantes:

- `project.yml`;
- `Sources/JarvisNativeApp.swift`;
- autenticação/contexto/cérebro local em `Sources/`;
- `PREPARAR-JARVIS.command`;
- `README-INSTALAR.md`.

Sequência de prova:

1. no Mac, executar `PREPARAR-JARVIS.command`;
2. gerar projeto com XcodeGen;
3. compilar no SDK Apple sem assinatura;
4. corrigir qualquer erro antes de instalar;
5. abrir Xcode;
6. assinar com conta Apple da usuária;
7. instalar no iPhone;
8. login único;
9. diagnóstico;
10. configurar Atalho Vocal;
11. testar hands-free;
12. testar tela bloqueada separadamente.

Não declarar “wake word com tela bloqueada” antes dessa prova.

## 13. Incidentes: Jarvis não responde

Investigar por camadas, nesta ordem:

1. **Sessão** — token existe/é válido?
2. **Piloto/autorização** — conta está autorizada?
3. **Modelo/runtime** — provider/zero-cost passou verificação?
4. **Memória** — consulta privada está disponível?
5. **Transporte** — API respondeu JSON esperado?
6. **Frontend** — `busyRef`/estado/retry liberou nova tentativa?
7. **TTS** — resposta existe, mas áudio falhou?
8. **Reconhecimento** — fala virou transcrição?
9. **Plataforma** — iOS suspendeu recurso?

Não mascarar falha de servidor pedindo novo código de login repetidamente.

## 14. Incidentes: “ele esqueceu”

Verificar:

- o dado foi salvo ou apenas falado?
- foi classificado como exploração/estado temporário?
- existe evento de continuidade?
- há versão superseded vigente?
- a consulta recuperou a fonte relevante?
- o modelo recebeu o pacote de contexto?
- a informação estava em conversa ChatGPT mas nunca foi importada para Jarvis?

Não resolver esquecimento copiando indiscriminadamente conversas antigas para Perfil DNA.

## 15. Self-healing

Pipeline futuro obrigatório:

```text
feedback/log
→ issue/tarefa com ID
→ reprodução
→ branch isolada
→ patch
→ testes
→ Preview
→ evidência
→ aprovação/política
→ promoção
→ rollback disponível
```

O agente pode automatizar partes desse fluxo. Produção não deve ser alterada sem gate.

## 16. Capability Radar

Configuração atual:

`config/capability-radar-sources.json`

O radar deve usar fontes oficiais e comparar mudanças. Não usar post viral como única evidência de mudança de API/modelo.

Quando uma novidade for encontrada:

- registrar data/fonte;
- impacto potencial;
- se afeta custo/segurança;
- se merece experimento;
- benchmark antes de promoção.

## 17. Documentação como parte do gate

Mudança relevante deve atualizar pelo menos um destes:

- `JARVIS_STATUS_CAPACIDADES.md` se a maturidade mudou;
- `JARVIS_ARQUITETURA_GERAL.md` se a arquitetura mudou;
- `JARVIS_MODO_DE_USO.md` se a experiência do usuário mudou;
- `CONTINUIDADE_JARVIS.md` se houve decisão/checkpoint técnico importante.

Documentação desatualizada é considerada regressão operacional.

## 18. Critério de manutenção saudável

Uma pessoa técnica ou outro agente de IA deve conseguir entrar no projeto, ler a documentação oficial, verificar o HEAD e continuar a construção sem pedir à usuária que conte novamente o que o Jarvis é.
