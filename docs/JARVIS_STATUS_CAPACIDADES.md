# Jarvis / Sol.IA — Status de capacidades

> **Fonte operacional de verdade sobre maturidade.** Atualizado em 23/09/2026.

Este documento existe para impedir duas falhas comuns: apresentar requisito como se já fosse capacidade pronta ou esquecer recursos que já foram implementados.

## Legenda

- **OPERACIONAL** — implementado e verificado no ambiente compatível.
- **PARCIAL** — funciona em parte, mas a experiência completa ainda não está comprovada.
- **IMPLEMENTADO / AGUARDA PROVA** — código existe; falta integração/Preview/dispositivo/plataforma real.
- **ARQUITETURA OFICIAL** — decisão de produto/documentação aceita; ainda não implica operação final.
- **PLANEJADO** — requisito aceito, ainda não entregue.
- **BLOQUEADO/DEPENDENTE DE TERCEIRO** — depende de API, permissão, credencial, revisão ou limitação externa.

## 1. Núcleo, memória e continuidade

| Capacidade | Status | Evidência/limite |
|---|---|---|
| Autenticação web por Supabase | OPERACIONAL | Fluxo por código de e-mail, sessão e RLS existentes |
| Cofre privado `solia_memories` | OPERACIONAL | Registros privados e auditoria existentes |
| Continuidade durável | OPERACIONAL | Eventos persistentes, busca e recuperação por usuário |
| Anti-fadiga raiz/galhos/delta | OPERACIONAL no núcleo | Contratos e integração existem; qualidade semântica continua evolutiva |
| Perfil DNA versionado | OPERACIONAL como infraestrutura | Cadeia de supersessão existe; quantidade de claims reais depende do uso |
| Separação resposta da IA x memória humana | OPERACIONAL | Histórico de assistente em tabela própria |
| Jarvis Core v1 read-only | OPERACIONAL | Endpoint privado recupera continuidade, perfil, histórico e conhecimento sem escrita/modelo |
| Loops/pendências como sistema formal completo | PARCIAL | Sinais raiz/galho existem; gestão completa de loops ainda evolui |
| Escopos tenant/workspace | PARCIAL / CONTRATOS IMPLEMENTADOS | `core/tenant-context.mjs` cria contexto explícito e falha fechado em cross-tenant/cross-workspace; banco piloto ainda é majoritariamente single-owner |
| Runtime do piloto com tenant explícito | IMPLEMENTADO / PREVIEW VERDE | Membership validada cria `personal:<user>` + workspace primário + `sol-pilot`; autorização de IA continua separada do pertencimento |
| Memória pessoal x organizacional | PARCIAL / CONTRATO IMPLEMENTADO | `classifyDataScope` impede promoção silenciosa de memória pessoal; persistência multi-tenant completa ainda futura |

## 2. Conhecimento e fontes

| Capacidade | Status | Evidência/limite |
|---|---|---|
| Biblioteca privada versionada | OPERACIONAL | Documentos + chunks + origem/versão |
| Busca textual sem modelo | OPERACIONAL | FTS e retorno com proveniência |
| Importação GitHub/trilogia | OPERACIONAL em leitura | Fontes canônicas selecionadas; não equivale a leitura irrestrita de qualquer repo |
| PDF/DOCX direto pelo chat | PLANEJADO | Chat atual aceita imagens e formatos textuais leves |
| Google Drive multi-conta nativo | PARCIAL/BLOQUEADO | Infraestrutura de conexão existe; fluxo nativo completo não concluído |
| Originais em storage privado com extração | PLANEJADO | Arquitetura prevista |
| Grafo genérico de ativos por tenant | ARQUITETURA OFICIAL | Definido em documentação; persistência dedicada ainda não entregue |

## 3. Conversa e modelos

| Capacidade | Status | Evidência/limite |
|---|---|---|
| Chat web autenticado | PARCIAL / GEMINI ATIVO | Backend/UI existem; Gemini 3.8 Flash é o caminho inteligente preferencial quando a chave Gemini está presente. `capture-only` fica restrito a contingência |
| Roteamento de especialistas | OPERACIONAL no backend | Não exige escolha manual de agente |
| Política fail-closed de custo | OPERACIONAL | Bloqueia fallback pago silencioso fora da autorização |
| Gateway via Vercel OIDC | OPERACIONAL como credencial de runtime | Não significa uso ilimitado |
| OpenAI/fornecedor premium como cérebro | PARCIAL/OPCIONAL | Pode entrar como motor substituível; custo e autorização continuam necessários |
| Modelo local Apple no iPhone | IMPLEMENTADO / AGUARDA PROVA FÍSICA | `FoundationModels` integrado; requer aparelho/OS compatível |
| Model Router multiforncedor completo | PARCIAL | Estratégia existe; orquestração dinâmica total ainda não |
| Política/model routing por tenant | ARQUITETURA OFICIAL | Requer camada multi-tenant e metering comercial |

## 4. Voz e realtime

| Capacidade | Status | Evidência/limite |
|---|---|---|
| TTS web local | CONTINGÊNCIA MANUAL | Não é mais a voz principal. Pode soar robótico; Gemini Live é a rota natural padrão |
| Reconhecimento de voz web | OPERACIONAL em primeiro plano | Depende do navegador; microfone precisa de autorização |
| Wake phrase web “Jarvis, tá aí?” | PARCIAL | Só com sessão já autorizada/ativa |
| Resposta “Tô aqui. Pode falar.” | IMPLEMENTADA | Código/testes; reteste físico recomendado |
| Conversa contínua web antiga | PARCIAL | Sessão engajada existe; limitações do navegador permanecem |
| Gemini 3.8 Live web | IMPLEMENTADO EM PRODUÇÃO / AGUARDA PROVA FÍSICA FINAL | Broker autenticado cria token efêmero; áudio nativo, transcrição e delegação ao Jarvis estão no código. O microfone principal do web agora abre Gemini Live, não TTS local |
| OpenAI GPT-Live 1 | IMPLEMENTADO EM PRODUÇÃO / CREDENCIAL AUSENTE | Fluxo oficial WebRTC implementado; continua opção explícita, sem fallback automático |
| Seletor Gemini/OpenAI | OPERACIONAL NO CÓDIGO | Gemini é o default atual; usuário escolhe o motor. Jarvis/memória/contexto permanecem independentes do fornecedor |
| Cliente nativo iOS hands-free | NOVO DELTA IMPLEMENTADO / AGUARDA BUILD XCODE E PROVA FÍSICA | App Intent, Keychain, background audio e cliente Gemini Live nativo estão no código; memória entra por `consult_jarvis` → Jarvis Core. TTS local não é mais padrão |
| Atalho Vocal “Jarvis, tá aí?” sem toque | IMPLEMENTADO / AGUARDA NOVA PROVA FÍSICA | A ação nativa abre o app e tenta iniciar Gemini Live com sessão do Keychain e voz persistida; primeiro uso ainda exige login/microfone |
| Tela bloqueada / background com sessão ativa | CONFIGURADO / NÃO COMPROVADO | `UIBackgroundModes=audio` + `playAndRecord`; a sessão deve começar legitimamente e precisa de prova física no iPhone |
| Identificação de locutor / voiceprint | IMPLEMENTADO EM CÓDIGO / AGUARDA XCODE + PROVA FÍSICA | FluidAudio/CoreML local, cadastro de embedding no Keychain e classificação `sol/guest/unknown`. Thresholds permanecem conservadores e precisam ser medidos no iPhone real. Voz nunca é autenticação única |
| Autorização de convidado por voz | IMPLEMENTADO EM CÓDIGO / AGUARDA SPEAKER ID VALIDADO | Outra voz bloqueia `consult_jarvis`; apenas voz classificada como Sol pode autorizar conversa genérica de convidado, sem liberar Cofre ao convidado |
| Clone de voz pessoal para conteúdo | EXPERIMENTO REPROVADO no primeiro ensaio | Não usar como voz padrão do Jarvis |

## 5. Câmera, vídeo e ambiente

| Capacidade | Status | Evidência/limite |
|---|---|---|
| Câmera web visível | OPERACIONAL | Preview local |
| Captura/análise de quadro sob comando | PARCIAL | Depende do cérebro de resposta disponível |
| Troca frontal/traseira | OPERACIONAL no código web | |
| Modo ambiente temporário | OPERACIONAL no web | Buffer local; não salva terceiros automaticamente |
| Visão contínua em streaming | PLANEJADO | Não confundir com captura de quadro |
| Videochamada multimodal contínua | PARCIAL/PLANEJADO | GPT-Live cobre áudio; vídeo contínuo ainda não |

## 6. Live e orientação em tempo real

| Capacidade | Status | Evidência/limite |
|---|---|---|
| Requisito “live no mesmo iPhone” | OFICIAL / PLANEJADO | Registrado no programa de construção |
| Orientação privada no ouvido | PLANEJADO | Deve usar rota isolada da live |
| Jarvis participante público | PLANEJADO | Exige mixagem pública autorizada |
| Alternância privado/público por comando | PLANEJADO | Ex.: “Jarvis, comigo” / “Jarvis, entra” |
| Leitura de chat YouTube | TECNICAMENTE VIÁVEL / NÃO INTEGRADA | Conector ainda não implementado no Jarvis |
| Instagram/TikTok Live chat | DEPENDENTE DE API/PLATAFORMA | Necessita prova das permissões atuais |
| Agrupamento de perguntas em tempo real | PLANEJADO | Depende do feed de chat |
| War Room / estrategista ao vivo | PLANEJADO | Requisito aceito; não certificado em live real |

## 7. Integrações e operação externa

| Capacidade | Status | Evidência/limite |
|---|---|---|
| GitHub como fonte de conhecimento | OPERACIONAL em leitura | Escrita autônoma pelo próprio Jarvis ainda não liberada |
| GitHub para desenvolvimento via ChatGPT | OPERACIONAL fora do Jarvis | Não confundir com conector interno do produto |
| Vercel hospedando web app | OPERACIONAL | |
| Vercel como ferramenta autônoma do Jarvis | PLANEJADO | |
| Supabase memória/auth | OPERACIONAL | |
| n8n/worker durável | PLANEJADO | |
| WhatsApp Business | PLANEJADO | Via oficial/autorizada |
| Instagram/Facebook/TikTok/YouTube | PLANEJADO/PARCIAL | Arquitetura existe; contas não estão todas conectadas |
| Google Drive | PARCIAL | Uso multi-conta nativo incompleto |
| CRM/ERP/financeiro genérico | ARQUITETURA OFICIAL / NÃO INTEGRADO | Conectores devem ser tenant-aware e começar read-only quando possível |

## 8. Inteligência crescente, radar e monetização

| Capacidade | Status | Evidência/limite |
|---|---|---|
| Capability Radar | OPERACIONAL em escopo inicial | OpenAI, Google/Gemini, Meta, TikTok, Vercel e Supabase têm fontes oficiais configuradas; mudança material exige revisão antes de alterar estratégia |
| Frontier Radar global | PLANEJADO | Expandir ecossistema mundial de IA/ferramentas |
| Radar de domínio por tenant | ARQUITETURA OFICIAL | Ainda sem pipeline multi-tenant operacional |
| Loop Tendência → Ativo → Resultado | ARQUITETURA OFICIAL | Documento canônico criado; automação completa ainda não |
| Opportunity Cards persistentes | PLANEJADO | Estrutura definida; armazenamento/workflow ainda não |
| Social Intelligence com métricas reais | PARCIAL/PLANEJADO | Depende de contas/conectores |
| Motor de monetização/objetivos genérico | ARQUITETURA OFICIAL | Precisa dados reais por tenant para operar plenamente |
| Testes de regressão | OPERACIONAL | Prebuild executa contratos Node |
| Gate de Preview | OPERACIONAL | Preview atual ficou READY com contratos e build passando |
| Autodiagnóstico web/runtime | PARCIAL | Health checks existentes |
| Autorreparo completo | PLANEJADO | Detectar → reproduzir → patch → branch → testes → Preview → aprovação → rollback |
| Alteração automática de produção | PROIBIDA POR PADRÃO | Não é objetivo do self-healing |

## 9. Multiusuário, agências e empresas

| Capacidade | Status | Evidência/limite |
|---|---|---|
| Produto parametrizável por tenant | ARQUITETURA OFICIAL | Definido em `ARQUITETURA_MULTIUSUARIO_E_PERSONALIZACAO.md` |
| Tenant context em código | PARCIAL / IMPLEMENTADO COMO CONTRATO | `core/tenant-context.mjs` exige tenant/workspace/user explícitos; runtime do piloto já recebe o adapter compatível |
| Sol como Profile Pack e não default global | PARCIAL / IMPLEMENTADO COMO CONTRATO | `core/profile-packs.mjs`: default global é `core-default`; `sol-pilot` só entra explicitamente |
| Profile Packs Agency/Company | IMPLEMENTADO COMO METADADO / NÃO OPERACIONAL | Registry existe; não significa workflow completo de agência/empresa |
| Core Skills + Skill Packs | PARCIAL / REGISTRY GENÉRICO IMPLEMENTADO | `core/skill-packs.mjs` define Core Skills neutras e packs de pessoa, creator, agência, empresa, vendas, engenharia, finanças etc.; skills legadas do piloto serão migradas progressivamente |
| Workspaces/projetos/clientes múltiplos | PLANEJADO | Entidades/documentação definidas; UI/banco comercial ainda não |
| Agência multi-cliente isolada | PLANEJADO | Exige persistência tenant/workspace/client + RBAC + testes de banco |
| Empresa com membros/roles | PLANEJADO | RBAC/ABAC comercial ainda não implementado |
| Billing/metering por tenant | PLANEJADO | Custos ainda não atribuídos comercialmente por tenant |
| White-label | POSSIBILIDADE FUTURA | Não é requisito do primeiro lançamento |
| Multi-tenant comercial isolado | PLANEJADO | Não chamar pronto antes de prova de isolamento, exportação e roles |

## 10. Segurança

| Capacidade | Status | Observação |
|---|---|---|
| RLS owner-only no piloto | OPERACIONAL | Dados pessoais isolados por `auth.uid()` |
| Segredos fora do frontend | OPERACIONAL como regra/testes | |
| Sessão nativa no Keychain | IMPLEMENTADO / AGUARDA PROVA FÍSICA | |
| Separação modo público/privado | OPERACIONAL no contrato | |
| Voz como autenticação única | NÃO PERMITIDO | Pode ser apenas sinal adicional |
| Passkey/Face ID para ações sensíveis | PLANEJADO | |
| Ações irreversíveis sem aprovação | NÃO LIBERADAS | |
| Isolamento `tenant_id/workspace_id` comercial | PARCIAL NO CONTRATO / NÃO NO BANCO | Helpers falham fechado; esquema persistente comercial ainda não migrado |
| Testes sintéticos cross-tenant/cross-workspace | OPERACIONAL NO CONTRATO | Casos de negação passam no Preview |
| Testes adversariais reais de banco cross-tenant | PLANEJADO/OBRIGATÓRIO | Gate antes de venda multiempresa |

## 11. Evidência de testes

No commit `05863a432eab0ed3e0df3535f21addddb2f5bd95`, a Preview Vercel do branch `work/jarvis-gpt-live-1-20260916` ficou **READY**.

Evidência da mesma build:

- **207/207 contratos Node passando**;
- contratos GPT-Live passando;
- contratos tenant/workspace e Profile Packs passando;
- contratos de Skill Packs genéricos passando;
- runtime do piloto vinculado a tenant explícito com testes de membership/negação;
- TypeScript `tsc -b` aprovado;
- Vite production build aprovado;
- deployment concluído pela Vercel.

Isto certifica os contratos e a compilação do branch, **não** certifica hardware Apple, qualidade de áudio real, live real, contas externas nem multi-tenant comercial em banco.

## 12. Próxima sequência oficial

1. provar Gemini 3.8 Live em aparelho/navegador real e medir áudio, interrupção, transcrição e encerramento; depois repetir a prova OpenAI quando houver credencial;
2. continuar a prova nativa Mac/iPhone;
3. introduzir `tenant-context` progressivamente nas novas services/repositories, sem alterar ainda os registros atuais do piloto;
4. desenhar a primeira migração persistente `tenant/workspace/member` em ambiente isolado, com estratégia de compatibilidade para dados atuais;
5. criar testes de banco cross-tenant antes de aplicar migração comercial;
6. expandir conectores em leitura e torná-los tenant-aware;
7. transformar Radar/Opportunity Cards em pipeline persistente;
8. generalizar skills atuais sem remover o Sol Profile Pack;
9. adicionar metering/custos por tenant;
10. somente então declarar operação comercial multi-tenant pronta.

**Regra:** uma capacidade só muda de status quando a evidência correspondente existe.

## 13. Referências, Minutos Magnetus e LÚCIDA — inspeção em 21/09/2026

Complemento restrito a esta frente; as demais linhas mantêm suas datas/evidências originais.
Fonte: [protocolo e auditoria de arquivos/SHAs](PROTOCOLO_REFERENCIAS_CONTEUDO_LUCIDA.md).

| Capacidade | Estado observado | Delta |
|---|---|---|
| Visionário | PARCIAL — classificador por palavras | Compreensão da fonte e oportunidade persistente |
| Diretrizes de audiência/crescimento | INTEGRADAS AO PROMPT DO CANDIDATO | Não equivalem a coleta real de métricas/respostas |
| Vídeo por URL, transcrição e análise de canal/música | PLANEJADO — conector completo não identificado no escopo | Aquisição autorizada, transcrição, cobertura e retomada |
| Série autoral com perguntas e grafo de continuidade | ESPECIFICAÇÃO MM01–MM17 | Geração/revisão persistente, nove roteiros no piloto |
| Episódio publicado conhecido pela LÚCIDA | ESPECIFICAÇÃO | Pacote versionado, indexação e avaliação |
| Telegram: respostas por texto/voz e identidade | PLANEJADO | Bot/app, mapeamento, consentimento e eventos |
| Insights de queixas/dúvidas para Sol | ESPECIFICAÇÃO | Agregação elegível e feedback ao Visionário |
| Mapa pré-mentoria | ESPECIFICAÇÃO PRÉVIA REUTILIZADA | Integrar handoff autorizado e provar entrega |
| Loop completo até receita | NÃO COMPROVADO | Integração ponta a ponta e métricas reais |

Nenhuma dessas novas capacidades foi ativada pela alteração de documentação.


## Execução adicional E1–E7 — 21/09/2026

A implementação e a matriz MM01–MM17 estão em [ENTREGA_REFERENCIAS_LUCIDA_2026-09-21.md](ENTREGA_REFERENCIAS_LUCIDA_2026-09-21.md). Base preservada: PR #8, `f75f63988dbdc461af08067a4be55a0f9e828e89`. Há código para tarefas duráveis, roteiros, ponte editorial e continuidade consentida na LÚCIDA; os 234 testes do Jarvis e a compilação passaram localmente. A contraparte Magnetus3 passou 25 testes unitários e 22 de integração HTTP, incluindo os seis novos. Os dados e o provedor usados nessas provas são sintéticos.

Vídeo inicial não lido; aquisição audiovisual/ASR, voz Telegram, qualidade editorial real, navegador/iPhone e ativação externa continuam pendentes. Nenhum gate anterior foi fechado por esta entrega. Não houve migração remota, publicação, envio a clientes, novo gasto ou treinamento de pesos. Ler o relatório antes de retomar; não reduzir Jarvis às funções editoriais.


## Continuação de implementação — ASR e Telegram (21/09/2026)

[CONTINUACAO_ASR_TELEGRAM_2026-09-21.md](CONTINUACAO_ASR_TELEGRAM_2026-09-21.md) registra o delta sobre a PR #11: ASR CPU real de áudio curto com prova controlada, leitura de legendas públicas, transcrição Telegram consentida/revisável na contraparte e novas pautas com raiz/pai persistidos. O histórico acima conserva o estado observado na entrega anterior; a ausência de executor ASR daquela data foi superada localmente, sem afirmar ativação externa.

238 testes Node e build Jarvis; 25 testes históricos do estúdio mais quatro de limites de transcrição; Magnetus3 com 25 unitários e 25 de integração HTTP. A inferência real usou áudio sintético próprio; Telegram/modelo editorial nas integrações continuam controlados. Vídeo solicitado, cobertura visual, amostra executora de canal, catálogo/perfil aprovado, qualidade editorial real, navegador/iPhone e conexão externa continuam pendentes conforme a matriz MM01–MM17 atualizada.

Próxima execução: [PROMPT_CONTINUACAO_ASR_REFERENCIAS.md](PROMPT_CONTINUACAO_ASR_REFERENCIAS.md). Operação: [ASR_LOCAL_OPERACAO.md](ASR_LOCAL_OPERACAO.md). Nenhuma faceta foi removida e E1–E7 não foram declaradas integralmente homologadas.
