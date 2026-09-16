# Programa de construção do Jarvis

Data original: 13/09/2026. Atualização de arquitetura: 16/09/2026. Núcleo: `Sollimastudio/SOL-IA`. Não reiniciar o projeto; trabalhar por delta.

Este documento transforma requisitos do piloto Sol em trabalho técnico e critérios de aceite. Complementa `CONTINUIDADE_JARVIS.md`, `JARVIS_PRODUTO_E_VISAO.md`, `ARQUITETURA_MULTIUSUARIO_E_PERSONALIZACAO.md`, `JARVIS_STATUS_CAPACIDADES.md` e as arquiteturas especializadas. Novos detalhes refinam requisitos anteriores; não certificam capacidades entregues.

## Atualização estrutural — 16/09/2026

A visão comercial deixa de ser “pegar o Jarvis da Sol e abrir cadastro para outras pessoas”.

Decisão:

- o **Core é reutilizável**;
- Sol é o primeiro perfil piloto profundo;
- os dados/obras/produtos/rotinas da Sol formam configuração própria, não defaults globais;
- todo novo componente deve ser desenhado com escopo `tenant/workspace/project/client/user` em mente;
- Skill Packs substituem hardcode de nicho;
- agência precisa poder administrar clientes isolados;
- empresa precisa poder administrar membros/roles/departamentos;
- Radar e Loop Tendência → Resultado são parametrizados pelo objetivo do tenant;
- multi-tenant comercial só será declarado pronto após isolamento, RBAC, metering e testes cross-tenant.

**Multiusuário comercial continua uma etapa futura; pensamento tenant-aware passa a ser restrição desde agora.**

## Responsabilidades e forma de trabalho

O cliente define intenção, objetivos, limites e o que uma boa experiência precisa permitir. A engenharia assume especificação, prompts internos, escolha técnica fundamentada, código, testes, integração, registro de decisões e retomada. Não exigir conhecimento técnico, gerenciamento de agentes, lembrança de links ou repetição do histórico.

No piloto, Sol ocupa esse papel. Em agência/empresa, políticas podem distribuir aprovação entre donos, administradores, membros e clientes aprovadores.

Codex/ChatGPT podem atuar como oficina de desenvolvimento sobre recursos conectados. Isso não equivale a um worker permanente já instalado dentro do Jarvis. Operação contínua exige serviços próprios, tarefas persistentes e recuperação.

“Profissional e definitivo” significa base mantida, verificável, recuperável e evolutiva. Não significa ausência absoluta de falhas, lucro garantido, vigilância universal ou fim da manutenção.

Fluxo de entrega:

`problema observado → requisito + novidade → mudança delimitada → teste → comportamento real quando necessário → evidência → documentação/status → próxima tarefa`

Ao retomar, consultar o estado salvo antes de pedir contexto novamente.

## Requisitos consolidados do piloto

1. A conversa cotidiana e pedidos de evolução devem migrar para dentro do Jarvis quando a infraestrutura permitir. O usuário deve poder dizer “corrija isto” e acompanhar resultado sem atuar como ponte técnica entre ferramentas.
2. Pedidos de engenharia: ID → requisito/defeito → especificação → patch isolado → testes → Preview → resultado → rollback.
3. Prompt engineering é infraestrutura, não outro personagem para o usuário administrar.
4. Live no mesmo telefone permanece objetivo do piloto: ouvir contexto autorizado, orientar privadamente e/ou participar publicamente com rotas separadas.
5. História de criação do Jarvis deve preservar fatos verificáveis e não inventar datas/tentativas/capacidades.
6. Legado/acervo precisa de autoria, originais, versões, cronologia, exportação e recuperação.
7. Visão comercial deve medir valor entregue e custo antes de escala; não prometer resultado financeiro.
8. Auditoria de históricos/repositórios é parcial enquanto não houver inventário completo.

## Generalização para outros clientes

As capacidades acima são reinterpretadas por objetivo.

### Individual/creator

Continuidade pessoal, criação, negócios, rotina, ativos, conteúdo, monetização, tecnologia.

### Agência

- operação interna;
- múltiplos clientes;
- brand profiles separados;
- calendário/campanhas/criativos/mídia;
- aprovações;
- métricas e custo/margem por conta;
- Radar que avalia uma trend por cliente.

### Empresa

- objetivos/KPIs;
- projetos;
- departamentos;
- conhecimento institucional;
- vendas/marketing/suporte/engenharia/operação;
- roles;
- auditoria;
- risco/custo.

### Novo setor

Configurar perfil, objetivos, fontes, skills, conectores e critérios de sucesso sem fork do produto.

## Relações editoriais do piloto Sol

Essas relações pertencem ao tenant/perfil da Sol e **não entram em contas novas**.

| Elemento | Relação relatada | Cuidado de continuidade |
|---|---|---|
| Feminicídio Emocional | Projeto nascido da experiência descrita por Sol | Preservar autoria e separar relato, conceito autoral e fontes externas |
| Posicione-se / Reposicione-se | Reflexão/obra ligada a posicionamento | Não fundir automaticamente método, títulos e revisões |
| Fuga Identitária | Tese autoral relacionada a dificuldades contemporâneas de posicionamento | Preservar tese e fontes sem inventar manuscrito concluído |
| Jarvis | Sistema criado para apoiar sua forma de pensar, criação e continuidade | Registrar tentativas verificadas e origem das decisões |

Esses dados são exemplo de profundidade de personalização, não esquema obrigatório de produto.

## Arquitetura e ordem de entrega

| Etapa | Construção | Critério de aceite | Estado/observação |
|---|---|---|---|
| 0. Uso cotidiano | acesso estável, sessão, recuperação de erro | abrir/retomar sem reset indevido | piloto em evolução |
| 1. Fala natural | interpretação contextual + voz | conversa sem exigir prompt técnico | web/realtime em evolução; provas pendentes |
| 2. Continuidade | eventos, decisões, tópicos, tarefas duráveis | retomar com fonte, decisão vigente e próximo passo | infraestrutura já avançou além do estado original deste programa |
| 3. Acervo | inventário, originais, relações | importar sem duplicar/sobrescrever e restaurar | biblioteca parcial |
| 4. Execução | fila persistente, workers, conectores | tarefa sobrevive ao fechamento e não duplica ação | pendente |
| 5. Voz/live | áudio, interrupção, público/privado | prova real no dispositivo/plataforma | GPT-Live implementado em branch; live completa pendente |
| 6. Evolução dentro do Jarvis | pedido → tarefa → patch → Preview | defeito enviado pelo produto gera entrega rastreável | pendente/parcial fora do app |
| 7. Fundamento multiusuário | tenant/workspace/client/role, Profile/Skill Packs | novas features não hardcodam Sol | arquitetura oficial; implementação incremental |
| 8. Produto multi-tenant | isolamento real, RBAC, metering, billing/export | duas+ organizações sem vazamento; agência multi-cliente | pendente |
| 9. Legado/delegação | exportação, recuperação, acesso designado | continuidade independente de fornecedor | pendente |

Etapas têm dependências, não datas prometidas. Usar entregas pequenas, evitar troca indefinida de repositório/interface/fornecedor.

Base: aplicação em Vercel; Supabase/PostgreSQL para estado; storage privado para originais; busca textual/semântica; workers/fila para tarefas longas; modelos para interpretar/produzir; executor para agir; testes/auditoria para comprovar.

## Checklist de continuidade

Em ambiente seguro/fixtures:

- [ ] evento possui dono/tenant, origem, ID e data;
- [ ] reenvio com mesmo ID não duplica;
- [ ] mesmo ID com conteúdo diferente gera conflito;
- [ ] paráfrase não funde objetivos sem evidência;
- [ ] correção cria revisão e preserva anterior;
- [ ] resposta da IA não vira fato/decisão humana;
- [ ] checkpoint conserva raiz, galhos, pendências e próximo passo;
- [ ] reinício recupera contexto sem depender do histórico do navegador;
- [ ] recuperação não fica limitada artificialmente às últimas memórias;
- [ ] falha deixa estado honesto;
- [ ] conta/tenant diferente não lê nem altera registros;
- [ ] modo público não recebe dado privado;
- [ ] export/restauração preservam relações/versões;
- [ ] evidência distingue fixture, integração e teste físico.

## Checklist multi-tenant obrigatório

Antes de comercialização para várias organizações:

- [ ] Tenant A não consulta Tenant B;
- [ ] cache/embeddings/busca respeitam tenant;
- [ ] jobs mantêm tenant/workspace;
- [ ] segredos/conectores são isolados;
- [ ] roles restringem ações;
- [ ] memória pessoal não vira institucional automaticamente;
- [ ] agência mantém clientes isolados;
- [ ] conta nova não recebe Sol Profile Pack;
- [ ] custos são atribuíveis;
- [ ] export/delete/restore são por tenant;
- [ ] testes adversariais cross-tenant passam.

## Live: prova de viabilidade

O requisito final do piloto Sol permanece um único iPhone quando tecnicamente viável. É necessário provar:

- plataforma/APIs;
- câmera/microfone;
- comentários permitidos;
- mixagem de áudio;
- interrupção;
- reconexão;
- rota privada que não vaza para público;
- latência real.

GPT-Live full-duplex foi implementado no branch atual como capacidade de voz; isso **não prova automaticamente** a experiência completa de live em Instagram/TikTok/YouTube nem tela bloqueada.

Comentários externos são dados, não comandos privilegiados para Cofre/sistema.

## Preservação de legado

Manter inventário por origem: localizado, acesso pendente, importado, verificado, duplicado, incompleto.

Para documentos:

- original;
- checksum;
- autor/origem;
- data disponível;
- versão;
- relação com obra/projeto;
- escopo/tenant.

Backup de banco não substitui cópia de arquivos/storage. Exportação deve ser testável e independente de fornecedor de modelo.

## Evidência, custos e manutenção

Cada tarefa relevante mantém estado, executor, evidência, impedimento e próximo passo. Usuário pode ver resumo curto e pedir detalhes.

Registrar custos antes de ativar escala: modelos, voz, vídeo, armazenamento, conectores, workers, processamento e manutenção.

### Atualização de autorização de custo

A política histórica era bloquear nova IA paga por padrão. Em 16/09/2026, a Sol autorizou especificamente a implementação/teste de GPT-Live para o piloto. Essa autorização **não deve ser interpretada como liberação ilimitada de todo modelo pago**. O restante continua seguindo política de custo/autorização e limites.

## Regra final

**O programa não constrói “um Jarvis igual para todo mundo”. Constrói um motor capaz de aprender o contexto certo de cada cliente sem misturar identidades, dados, objetivos ou custos.**
