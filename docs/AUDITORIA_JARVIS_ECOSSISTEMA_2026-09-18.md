# Auditoria de engenharia — Jarvis, Relacione-se e LÚCIDA

Data: 18/09/2026. Estado: auditoria focal com correção testada em ambiente sintético; NÃO é certificação integral, promoção para produção nem aprovação comercial.

## 1. Mandato e fontes de verdade

Sol pediu inspeção do trabalho recente do Codex, desempenho, programação, relação entre Jarvis, Universo Relacione-se e LÚCIDA, com operação futura centralizada no Jarvis e atendimento no WhatsApp.

Leituras efetivas: metadados/branches/PRs do GitHub; comparação PR6→PR7; fontes do broker, transporte e componente de voz; package.json; status de capacidades; cânone Relacione-se/LÚCIDA; relatório M1 do Magnetus3; deployments/builds Vercel; metadados, contagens e definições de funções no Supabase; documentação oficial atual dos fornecedores. Não houve leitura linha a linha de todos os repositórios históricos, inspeção do Mac ou prova física do iPhone. O acesso ao health da prévia retornou redirecionamento SSO, não uma resposta de saúde do aplicativo. Uma consulta complementar agregada de integrações foi bloqueada pela ferramenta e não foi contornada.

Repositório canônico do núcleo: `Sollimastudio/SOL-IA`. Não criar núcleo concorrente, excluir fontes antigas, sobrescrever trabalho local, executar force-push ou promover produção automaticamente.

## 2. Snapshot remoto antes desta correção

| Objeto | Evidência observada |
|---|---|
| Main / domínio principal do Jarvis | `9ae1b3f69986cf27ec4faf4df59aaedc18baad0a`; deployment `dpl_ErSTR26uGDZfBadYXdKXF7XP5xmY`, criado em 06/08/2026 23:14 UTC, target production |
| PR6 | Branch `work/jarvis-neural-conversa-segura-20260908`; HEAD `10a6860378b7e855b8129d1a17f99ae0647fe195`; aberto, draft |
| PR7 | Branch `work/jarvis-gpt-live-1-20260916`; HEAD `b53645f567cdf81fe58b71b8084ecce75614f085`; aberto, draft, empilhado sobre PR6 |
| Delta PR7 | 56 commits, 49 arquivos, 5.120 adições e 1.235 remoções; não equivale a 49 capacidades operacionais |
| Último commit remoto auditado do Jarvis | 16/09/2026 16:34:33 UTC; busca de commits dessa branch desde 17/09 retornou vazia |
| Preview PR7 | `dpl_54ec86EtzPnLqg9KVKn7fazLb1aa`, READY, target null, mesmo HEAD b53645f |
| Build dessa Preview | 207 testes Node, 207 aprovados, zero falhas; TypeScript e Vite aprovados |
| Proteção de branches | As sete branches listadas informaram protected=false; rulesets adicionais não foram verificados |

Conclusão: o endereço principal NÃO entrega automaticamente o código da prévia. A atividade local de 24 horas relatada por Sol não pode ser auditada remotamente enquanto não houver checkpoint visível. Isso não prova que o Codex ficou parado. Preservar o diretório local, inventariar alterações e publicar somente arquivos revisados em branch antes de reconciliar. Nunca executar `git reset --hard`, `git clean` ou push forçado para resolver essa divergência.

O build verde prova contratos e compilação, não microfone real, assinatura Apple, velocidade de resposta, login ponta a ponta ou uso com tela bloqueada.

## 3. Correção executada nesta revisão

Fonte original do transporte: `src/core/gptLiveClient.mjs`, blob `de7074ba43624afdbdddb6d7aab5be24742d2227`. A cópia local foi validada contra o hash Git original antes de editar.

Foram escritos dez testes de regressão com navegador, microfone, WebSocket e HTTP sintéticos. No original: 0 aprovados / 10 falhas. Após a correção: 10 aprovados / 0 falhas, com `node --test tests/gpt-live-lifecycle.test.mjs` em Node 22.16.0. `node --check` aprovado. Nenhuma chamada paga ou áudio pessoal foi usado.

Correções:
- Encerrar novamente uma sessão já encerrada deixa de criar promessa pendurada indefinidamente.
- Permissão de microfone que chega depois de cancelar tem suas trilhas liberadas, sem abrir sessão tardia.
- Cancelamento durante emissão de token aborta a requisição; resposta tardia não abre WebSocket.
- Tentativas concorrentes de conexão são bloqueadas antes de adquirir dois microfones.
- Eventos atrasados não ressuscitam sessão encerrada.
- Uso final ausente, nulo, negativo ou inválido não é marcado como confirmado; callback de interface não controla a liberação de recursos.

O arquivo publicado desta correção tem blob `1be9c30db10e563eb7b56e2b618b85905c1c3d84`, idêntico ao arquivo testado. O teste novo entra automaticamente no prebuild existente. A execução completa do novo candidato na Vercel e a prova real do aparelho são gates separados: não somar 207+10 e declarar 217 aprovados sem consultar o novo build.

Não se alterou modelo, fornecedor, preço, estratégia, autorização do piloto ou produção. O cliente encerrado é terminal; uma nova conversa usa nova instância, como já faz a interface.

## 4. Custo e limites da voz

O código já usa Vercel AI Gateway, tanto para token quanto para WebSocket, com `openai/gpt-live-1`. Portanto a recomendação anterior de adicionar essa rota como se ainda não existisse está superada pelo código inspecionado.

A OpenAI publicou US$0,05/min para a camada de voz. O contador atual não agrega eventuais custos do modelo de raciocínio delegado. Uma rota diferente para o mesmo fornecedor não é fallback independente contra indisponibilidade desse fornecedor.

Pendências antes de ampliar o piloto:
1. Ledger de custo por sessão/usuário/fornecedor e reconciliação com uso final.
2. Admissão de sessões, simultaneidade e orçamento no servidor; o broker auditado verifica autenticação e flags, mas não reserva orçamento monetário/duração.
3. Diferenciar na interface estimativa, uso reportado e cobrança reconciliada. Não garantir parada da cobrança apenas porque fechou a interface.
4. Testar timeout, queda de rede, suspensão da aba e mudança de modo durante autenticação ainda pendente no componente React.

A RPC `reserve_solia_jarvis_turn()` inspecionada limita tentativas de chat a 40/dia por auth.uid(). Esse limite NÃO demonstra limite equivalente de minutos de voz. Não aumentar o teto sem autorização.

## 5. Memória e segurança do Supabase

Projeto canônico observado: `rkkpbmzrucaghrojujvb`, ACESSORA-SOL.IA, ACTIVE_HEALTHY, Postgres17. A outra instância acessível, `gsrltjndmyiwkmudnpyl`, não teve sua função reconciliada; não presumir que seja o banco da LÚCIDA.

Contagens exatas, sem exportar conteúdo pessoal:
- 101 documentos de conhecimento e 643 chunks. A estimativa de catálogo era 102 documentos; a contagem SQL exata prevalece.
- 16 memórias pessoais, 16 eventos de continuidade e 10 respostas no histórico separado.
- 0 registros em solia_profile_claims: infraestrutura DNA existente não significa perfil já povoado.
- 3 conexões cadastradas e 0 credenciais nessa tabela: cadastro não comprova OAuth funcional.
- Um piloto, can_use_ai=true e can_use_realtime=true.

Todas as 25 tabelas públicas listadas possuem RLS habilitada. Isso NÃO certifica correção das políticas nem isolamento comercial multi-tenant. A documentação reconhece contratos tenant/workspace, mas banco comercial e provas adversariais reais ainda pendentes.

O Security Advisor indicou três funções com search_path mutável: public.handle_updated_at(), public.handle_new_user() e public.handle_new_user_profile(). As definições foram lidas: inserções qualificadas em public.profiles e atualização via now(). Preparar hardening com search_path vazio, testar em ambiente isolado e versionar migração/reversão antes de aplicar. Nenhum DDL foi aplicado nesta auditoria.

Outros avisos envolvem visibilidade do esquema GraphQL, funções SECURITY DEFINER acessíveis a authenticated, RLS sem políticas e proteção contra senhas vazadas desativada. Não confundir descoberta de nomes de tabelas com vazamento de linhas. Não abrir políticas nem revogar RPCs indiscriminadamente: parte do desenho usa RPC autenticada, auth.uid() e ownership. Login atual é prioritariamente por código, o que também muda a prioridade do aviso de senha.

## 6. Ecossistema: autoridade única, dados separados

Fontes canônicas consultadas:
- `universo-relacione-se/README.md`: RELACIONE-SE marca-mãe; Método Posicione-se eixo; Magnetus presença; Antídoto padrões; LÚCIDA transversal.
- `universo-relacione-se/04-lucida/README.md`: quatro bases de evidência; memória revisável/deletável; sem diagnóstico; handoff com seleção e consentimento.
- `Magnetus3/README.md` e `docs/09-execucao/M1-ENTREGA-E-HOMOLOGACAO-v1.md`: implementação e bloqueios do produto.
- `biblia-magnetus` e `trilogia-sol-lima` continuam autoridades especializadas segundo os mapas consultados; seu conteúdo integral não foi reauditado nesta rodada.

Arquitetura recomendada, NÃO conexão já entregue:

Sol → Jarvis (comando, aprovações, operação e relatório)
     → serviços autorizados de conteúdo, publicação, suporte e negócio
     → plataforma Relacione-se (produtos, acesso e progresso)
     → LÚCIDA (inteligência do percurso de cada cliente)

Jarvis não substitui a LÚCIDA, e LÚCIDA não recebe acesso irrestrito ao Cofre da Sol. Reutilizar infraestrutura não significa fundir identidades, prompts ou memórias.

O acesso integrado vigente é Magnetus Mulher + Caderno Vivo + Antídoto + LÚCIDA; não reintroduzir assinatura global ou cobrança separada sem decisão autoral.

A ponte operacional deve começar por status técnico, catálogo autorizado e métricas minimizadas/agregadas. Registros reflexivos individuais só seguem o handoff explícito: prévia → seleção → edição/exclusão → consentimento → envio seguro. Nenhum relatório secreto de clientes para a autora.

A biblioteca do Jarvis precisa de inventário por origem, hash, versão, consentimento e última sincronização. Não ficou comprovado nesta rodada que os 101 documentos incluem todos os cânones alterados em 16–18/09. Não varrer todo o corpus nem promovê-lo a memória pessoal automaticamente a cada conversa.

## 7. Estado verificável do Magnetus/LÚCIDA

O relatório M1 registra D0–D3, memória com consentimento/revogação, Antídoto e endpoint Responses implementados. Corpus: 99 fontes, 1.586 trechos, índice m1-52b9d03cc295e0ef, incluindo três livros. São dados de outra biblioteca, não os 101/643 do Jarvis.

O relatório registra 21 testes locais e 16 de integração com inferência sintética. Não foram reexecutados por esta auditoria. A CI consultada diretamente, run35289913123, job105430295867, falhou em um segundo com steps=[] e runner_id=0. Nenhuma causa de cobrança, permissão ou código foi comprovada; o endpoint de check-run adicional não estava disponível pelo conector.

Projeto Vercel descoberto: `relacionese-magnetus-m1`, prj_H5oksOQw9APYY7EjuEKs33dsg5E9, sem vínculo Git na listagem. O relatório identifica prévia protegida READY no deploy dpl_GZyk1sGPdT4YgX8VrGAHD5Ldqgax, enviada manualmente. Faltam banco persistente, DATABASE_URL com papel adequado, BETTER_AUTH_URL/SECRET, OPENAI_API_KEY e LUCIDA_MODEL. Não solicitar segredos em chat, reaproveitar banco privado da Sol ou convidar clientes para contornar esses gates.

Aceite: PostgreSQL persistente, RLS dois usuários, login real, retomada, D0–D3 desktop/mobile, modelo real com avaliação semântica, consentimento/revogação e qualidade visual. O preview compilado não conclui M1.

A equipe Vercel está no plano Hobby; a documentação atual limita esse plano a uso pessoal não comercial. A hospedagem comercial do ecossistema exige adequação de plano/provedor antes do lançamento. Nenhuma assinatura ou upgrade foi contratado nesta rodada.

## 8. WhatsApp: integração necessária, ainda não ativada

Meta Business Portfolio/WABA, número autorizado, permissões, webhook e segredos protegidos precisam de inventário. A busca de plugins não localizou uma integração WhatsApp oficial utilizável nesta sessão. Isso não significa impossibilidade da Cloud API.

A política oficial exige opt-in para contato proativo, templates aprovados fora da janela de 24h e caminho claro de escalonamento. Os termos de 06/03/2026 têm exceção expressa para números do Brasil e EEE na cláusula AI Providers; não repetir uma proibição global desatualizada. A elegibilidade concreta da conta e do caso de uso continua a ser validada antes da ativação.

Piloto recomendado: atendimento dos produtos Relacione-se em modo rascunho primeiro. Identificar assistente automático; não fingir ser a Sol. Verificar assinatura sobre o corpo original do webhook, deduplicar por ID de mensagem, ordenar por conversa, persistir antes de confirmar recebimento, limitar retries, encaminhar falhas e manter transferência humana.

Roteamento: dúvida comercial → catálogo autorizado; acesso/progresso → serviço do produto; reflexão no método → LÚCIDA com contexto consentido; reembolso, disputa, crise ou exceção → pessoa responsável. Não dar ao agente público chaves de deploy, conta administrativa ou Cofre pessoal. Não prometer resposta integral no WhatsApp pessoal, scraping de grupos ou controle irrestrito do telefone.

## 9. Automação operacional: sim; uma agenda de chat não basta

Recomendação de engenharia, não serviço instalado: fila persistente + executor durável + adaptadores oficiais + autorização no servidor + registro de resultados. n8n é opção de conector/orquestração, não requisito nem nova fonte de verdade. Reusar componentes já existentes após inventário.

Cada tarefa deve carregar identidade/workspace, evento de origem, idempotency_key, escopo de dados, autorização, orçamento, tentativas, prazo, estado e evidência final. Estados mínimos: recebido → validado → pendente/aprovado → executando → concluído/falhou/encaminhado.

Ler, diagnosticar e preparar rascunhos pode ser automatizado dentro das permissões. Atendimento rotineiro só após aprovação da política e do piloto. Publicação, campanha paga, reembolso, alteração de acesso, uso de dados sensíveis e produção ficam com regras explícitas e aprovação proporcional ao risco. Não automatizar desenvolvimento sem limites de tempo/custo, critério de parada e checkpoint verificável.

Aprovação precisa vincular destinatário, conteúdo e operação: uma edição posterior invalida a aprovação. Duplicação de webhook não pode gerar resposta, cobrança ou concessão de acesso duplicada. Toda escrita deve retornar prova; modelo não decide sozinho que uma ferramenta funcionou.

## 10. Fila técnica e gates

| Ordem | Entrega | Prova de encerramento |
|---|---|---|
| P0 | Conciliar checkpoint local, PR6, PR7 e este delta | SHA, arquivos preservados, diff revisado; sem reset destrutivo |
| P0 | Validar correção de voz | Suite completa + build Preview + teste físico de cancelar, retomar, interromper e encerrar |
| P0 | Concluir nativo conforme runbook vigente | Compilação Xcode, assinatura autorizada, instalação e diagnóstico no iPhone; tela bloqueada testada separadamente |
| P0 | Orçamento real de voz e correção de rótulos de custo | Admissão atômica, concorrência, teto, uso final e interrupção comprovados |
| P0 | Segurança persistente | Migração ensaiada, auth/RLS regressão, nenhum cross-user/cross-tenant; hardening sem revogar acessos necessários |
| P1 | M1 Relacione-se/LÚCIDA utilizável | Banco + credenciais seguras + CI com logs + modelo real + jornada e visual aprovados |
| P1 | Jarvis consultar operação do ecossistema | API read-only autenticada, dados minimizados, fontes/versões, sem leitura implícita de memória de clientes |
| P1 | WhatsApp privado em rascunho | Número/WABA autorizados, consentimento, webhook/idempotência, cenários de falha e escalonamento |
| P2 | Executor durável e ações delimitadas | Sobrevive a restart, orçamento e retries finitos, aprovações, auditoria e evidências |
| P2 | Conteúdo e métricas | Criar → revisar → aprovar → publicar autorizado → medir; não transformar tendência em estratégia automática |

Antes de merge, ler de novo os HEADs para não sobrescrever atividade concorrente. Documentar prova com SHA e ambiente. Só chamar operacional quando a jornada real correspondente passar. Esta lista organiza dependências; não substitui a sequência nativa nem autoriza lançamento comercial ou mudança de estratégia.

## Fontes oficiais verificadas em 18/09/2026

- OpenAI GPT-Live-1 API: https://openai.com/index/introducing-gpt-live-1-in-the-api/
- WhatsApp Business Messaging Policy: https://business.whatsapp.com/policy
- WhatsApp Business Solution Terms: https://www.whatsapp.com/legal/business-solution-terms
- Vercel Hobby: https://vercel.com/docs/plans/hobby
- Supabase funções: https://supabase.com/docs/guides/database/functions
- Supabase changelog: https://supabase.com/changelog

As fontes externas confirmam recursos/regras do fornecedor, não a implementação dentro do Jarvis. Os resultados anteriores de alertas que não foram revalidados aqui não devem virar instrução executável automaticamente.
