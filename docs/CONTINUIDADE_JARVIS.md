> **Requisito congelado — 25/09/2026:** o Capability Radar deixa de ser apenas monitor de novidades e passa a exigir comparação multifornnecedor, custo-benefício por tarefa, benchmark e Opportunity Cards supervisionados. Nenhum fornecedor é padrão por prestígio ou novidade. Ler [RADAR_COMPARATIVO_MULTIFORNECEDOR_2026-09-25.md](RADAR_COMPARATIVO_MULTIFORNECEDOR_2026-09-25.md) antes de alterar modelos, APIs, custos ou estratégia.

> **Checkpoint Speaker ID — 24/09/2026:** o app nativo agora tem implementação local de voiceprint com FluidAudio/CoreML, Cofre bloqueado para locutor não-Sol, autorização de convidado e aprendizado linguístico apenas de turnos verificados. **Ainda não é capacidade física homologada:** falta Xcode + iPhone real. Ler [CHECKPOINT_SPEAKER_ID_LOCAL_2026-09-24.md](CHECKPOINT_SPEAKER_ID_LOCAL_2026-09-24.md) antes de alterar identidade de voz.

> **Requisito congelado — 23/09/2026:** a experiência hands-free, voz Gemini nativa, ativação à distância, ambiente, Speaker ID, convidados e autoevolução supervisionada estão definidos em [REQUISITO_HANDSFREE_VOZ_IDENTIDADE_2026-09-23.md](REQUISITO_HANDSFREE_VOZ_IDENTIDADE_2026-09-23.md). Leia junto com o checkpoint multiprovedor antes de alterar voz/ativação. `Modelo: none` não é aceite normal.

> **Checkpoint prioritário — 23/09/2026:** voz web agora é multiprovedor. Gemini 3.8 Live está implementado com token efêmero e a produção reporta credencial Gemini presente; OpenAI GPT-Live 1 permanece implementado via WebRTC, mas sem credencial em produção. Ler primeiro [CHECKPOINT_LIVE_MULTIPROVEDOR_2026-09-23.md](CHECKPOINT_LIVE_MULTIPROVEDOR_2026-09-23.md). Identificação de locutor/voiceprint da Sol e autorização de convidados continuam pendentes e não podem ser confundidas com transcrição.

> **Checkpoint documental adicional — 21/09/2026:** Sol pediu preservar e incorporar MM01–MM17: referências por link, Visionário, séries autorais, LÚCIDA, respostas Telegram, aprendizado e mapa pré-mentoria. Ler [PROTOCOLO_REFERENCIAS_CONTEUDO_LUCIDA.md](PROTOCOLO_REFERENCIAS_CONTEUDO_LUCIDA.md). A inspeção usou o candidato PR #8 em `0cc1e4a79a370333dccf9c99cffc8688e28d2366`, além de main e fontes canônicas. Este registro adiciona documentação à branch do candidato; não muda prioridades de voz/login, código, banco ou produção. As referências antigas a PR #6 abaixo são históricas e não substituem a conferência do HEAD atual.

# Jarvis / Sol.IA — continuidade verificável

## Ponto único de trabalho

Repositório: `Sollimastudio/SOL-IA`. O `main` é a referência operacional atual e deve ser comparado com qualquer branch antes de continuar. PRs antigas citadas abaixo são histórico, não a base ativa.
Preservar a interface Neural, o núcleo seguro e os checkpoints. Não criar outro Jarvis nem recomeçar o projeto em outro repositório. Mudanças de provedor, banco, custo, segurança ou produção exigem teste, evidência e rollback.
Antes da continuação, ler `REQUISITO_HANDSFREE_VOZ_IDENTIDADE_2026-09-23.md`, `CHECKPOINT_LIVE_MULTIPROVEDOR_2026-09-23.md` e conferir o HEAD real do `main`.

## Correção de produto e aceite — amostra de voz REPROVADA pela Sol

Feedback explícito: “Nem de longe parece a minha voz”; Sol considera as experiências dela com CapCut/ElevenLabs muito superiores. Isso é critério de qualidade e avaliação direta da dona da voz, não benchmark controlado entre fornecedores. O ensaio WAV de 5,04 s permanece válido como execução técnica, mas **foi reprovado em semelhança**. Não voltar a tratá-lo como pendente de escuta/aprovação, pedir que ela avalie o mesmo arquivo outra vez ou promovê-lo a voz pronta. Áudio mantido apenas para histórico; relatório privado e trabalho receberam `rejected_by_owner`/`human_review=rejected`.

**Duas finalidades obrigatórias:**

- Jarvis conversa, lê e participa de chamadas com sua própria voz de assistente, distinta da Sol. A rota principal atual usa áudio nativo do Gemini Live; síntese do aparelho existe apenas como contingência manual e não é critério de aceite.
- A voz pessoal da Sol é uma ferramenta para criar conteúdo **somente quando ela pedir explicitamente**. Ouvir/aprender sua fala não autoriza reproduzi-la em respostas, chamadas ou mensagens por ela. Clone não é autenticação.

Corrigida mensagem da interface que sugeria que a leitura do Jarvis deveria evoluir para a voz da Sol. Diretiva compartilhada de conversa atualizada. Síntese pessoal exige sinal explícito de pedido de conteúdo e trabalho identificado para conteúdo; recusa destino de diálogo. Renderização recusa narração reprovada, inclusive se já existir prévia antiga. Esses controles no worker não são autenticação remota; integração ao aplicativo continua pendente.

**Revisão do ensaio:** a referência foi escolhida por energia/pausas em uma janela de dez segundos; isso não mede representatividade de timbre, sotaque ou cadência. Usou Chatterbox Multilingual V3 e parâmetros padrão do gerador; a equivalência dos tokens só valida processamento de texto. Ainda não há evidência para atribuir a falha a uma causa única. Não culpar a gravação nem prometer que trocar um parâmetro resolverá.

**Próxima prova de qualidade:** rever seleção representativa dentro do áudio já recebido e configuração/modelo; comparar poucas variações com o mesmo roteiro curto de conteúdo, referências e alterações identificadas; avaliar semelhança, sotaque brasileiro, ritmo e pronúncia antes de incorporar ao estúdio. Não usar saudação do assistente como demonstração da voz pessoal. Não gerar várias amostras aleatórias nem contratar serviço novo. Voz conversacional, login protegido e memória continuam na frente de uma integração de clone ainda reprovado.

## Histórico — primeira síntese real, evidência de 13/09/2026 UTC

Executada geração real no ambiente de desenvolvimento Linux/CPU usando a referência já recebida da Sol. Resultado: WAV mono/24 kHz, 5,04 s, 74,384 s de execução, pico de memória de 6.964.708 KiB (~6,64 GiB). FFmpeg decodificou sem erro; amostras finitas e sinal não silencioso, sem amostras próximas do limite digital. Original e referência preservados. Áudio e relatório privados ficaram fora do GitHub. Não pedir outra gravação agora.

O modelo é Chatterbox Multilingual V3: código `5de7a54aa4e5e2baadb0182dde554908b48b85c2`, pesos `5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18`. Perth fixado em `ff1c8ac55a976971245cdd53c18d6131ca00d993`; a chamada de marca de procedência foi preservada. Sem API de geração paga ou contratação de GPU. É inferência com referência, não treinamento de uma tecnologia fundacional própria, nem garantia de serviço gratuito permanente.

Primeira tentativa falhou com download incidental de segmentação chinesa no construtor upstream. Corrigido adaptador para inicializar apenas português, conservando vocabulário/encoder e bloqueio de rede. Dezesseis comparações com o tokenizer real foram idênticas. Instalador explícito de pesos com hashes, revisão fixa, retomada de arquivos íntegros e recusa de arquivo divergente adicionado. 23 testes locais passaram; CI deverá ser registrada na PR junto ao commit desta entrega.

**Prova alcançada:** modelo real produziu mídia nova usando a referência autorizada. **Aceite posterior:** semelhança reprovada pela Sol. Naturalidade e roteiro pronunciado não receberam aprovação específica; uso contínuo no iPhone; voz em tempo real; avatar/gestos/videochamada; segurança por dispositivo. Não marcar esses itens como concluídos. Não enviar o áudio privado para a PR/CI.

**Passo realizado depois desta execução:** a Sol ouviu e reprovou a semelhança. Antes de integrar produção de conteúdo, rever a qualidade conforme correção de produto acima. A execução de 74 s para 5 s de fala ainda não atende conversa em tempo real. Login persistente, proteção de acesso e memória durável continuam prioridades do núcleo; nenhuma dessas foi certificada pela síntese. A abertura pelo ícone já foi confirmada pela Sol e não deve ser testada novamente por falta de memória do atendimento.

Ler `local_studio/README.md`, `model-lock.json` e `environment-linux-cpu.txt` para reprodução. O inventário fixa versões observadas; não é um lock completo de hashes nem validação do Mac. O ambiente atual permitiu esta prova: não voltar a dizer que nada pode ser tentado só porque as especificações do Mac são desconhecidas.

## Atualização 13/09/2026 — referência de voz recebida

Sol enviou M4A de aproximadamente 3m45s. Foi decodificado e recebeu análise acústica, candidato de referência e cópia de tratamento leve; arquivo original preservado. Não pedir nova gravação de voz agora. Foi implementada entrada somente de áudio no estúdio. Ler `docs/VOZ_CONTINUA_E_VIDEOCHAMADA.md`: aprender seu jeito em conversas, edições de áudio/vídeo e conversar por chamada de vídeo foram acrescentados ao pedido. Não confundir métricas de áudio com emoções/diagnóstico, prévia de câmera com chamada de IA ou referência preparada com voz clonada. Não houve escuta suportada, treinamento, síntese real ou ligação ao iPhone nesta etapa. O equipamento/modelo continuam pendentes.

## Atualização 13/09/2026 — estúdio com a identidade da Sol

Ler `docs/ESTUDIO_IDENTIDADE_SOL.md` e `local_studio/README.md`. Sol esclareceu que quer ideia falada → roteiro → narração com sua voz → vídeo com seu rosto/expressões/gestos, sem gravar cada conteúdo, usando sua conta paga do ChatGPT e evitando novas despesas. Não reduzir esse objetivo a cofre de notas nem confundir assinatura com crédito API. Há agora código local para preparar referências, adaptar síntese em português e montar prévia estática; clonagem real, animação, gestos e ligação ao iPhone continuam pendentes de evidência. A segurança por dispositivo também permanece pendente; voz clonada não autentica a dona.

## Atualização 13/09/2026 — orçamento zero e abertura no iPhone

Ler `docs/ORCAMENTO_ZERO_VOZ_E_SEGURANCA.md`. Sol estabeleceu nenhum gasto novo agora. A geração remota fica pausada por padrão; captura e consulta do cofre passam a funcionar sem chamada de IA, com confirmação e ID estável para resolver envio ambíguo. Não confundir este modo com IA generativa local, nem franquia de hospedagem com recurso ilimitado. Voz local de leitura não é clonagem.

Sol confirmou abertura pelo ícone no iPhone e informou que houve login/envio de código nessa instância. Instalação confirmada por relato; sessão prolongada e proteção por biometria ainda pendentes. Novo requisito: impedir terceiros de operar como Sol sem repetir login por frase. Passkeys/verificação no dispositivo são o caminho a validar; voz não será credencial única. Nenhuma biometria ou configuração Auth adicional foi ativada nesta rodada.

## Atualização 13/09/2026 — engenharia assumida pelo produto

Ler `docs/PROGRAMA_DE_CONSTRUCAO_JARVIS.md` e o [adendo de requisitos](https://github.com/Sollimastudio/SOL-IA/pull/6#issuecomment-5654738092) antes de retomar. Contêm a sequência atual, testes de aceite, live no mesmo iPhone, preservação do legado e evolução solicitada dentro do Jarvis. A auditoria do passado continua parcial; não pedir que a Sol reconstitua tudo de memória.

A correção mais recente permite apontar repetição quando ajudar a reconhecer um ciclo e decidir, sem bronca nem contagem habitual. Relatórios completos permanecem sob demanda. Captura automática durável é objetivo pendente, não capacidade certificada.

O Prompt Autopilot anterior não estava ligado ao chat ativo. A versão `2026-09-13.1` passa a integrar a requisição ao modelo por `server/jarvis-chat.mjs`, com fonte única em `core/prompt-autopilot.mjs`; `promptVersion` identifica a versão na resposta da API. Testes com provedor simulado comprovam integração e limites, não qualidade semântica real. A próxima entrega estrutural é continuidade durável, conforme o procedimento do programa. Registro posterior: abertura pelo ícone foi confirmada pela Sol; sessão prolongada e proteção no dispositivo continuam pendentes. Não repetir o teste já recebido da capa azul.

## Atualização 13/09/2026 — queixas do teste móvel

Ler `docs/QUEIXAS_E_ACEITE_MOBILE_2026-09-13.md`: login recorrente, falha piloto antes de salvar, memória detalhada/Perfil DNA, voz bloqueada e qualidade da assessoria. Contém evidências e critérios, não certificação de entrega.
Duas gerações reais retornaram 200, depois duas validações piloto falharam 503; o marcador fictício não foi gravado. Esta revisão adiciona diagnóstico seguro, recuperação limitada de sessão, indicador honesto e estado desconhecido para gravação sem confirmação. Histórico completo e voz em background continuam pendentes. Não pedir códigos para mascarar falha de servidor nem rotacionar share links.

## Objetivo que não pode ser perdido

Assessor pessoal por voz e vídeo, porta única para especialistas (apoio jurídico, autorreflexão, conteúdo/copy, tráfego, editorial, audiovisual, tecnologia e negócios). Captura da cama por palavra de ativação com privacidade; memória corrigível; acompanhamento de fontes autorizadas; live em modo público; identidade/clone autorizados; futura venda com dados isolados por cliente. Livros são parte do assessor, não substituem o produto.

A interface principal deve permanecer simples: conversar com Jarvis. A complexidade dos agentes, fontes, memória, tarefas e integrações fica nos bastidores ou em uma central secundária. A usuária não deve precisar escolher agente para tarefas comuns.

## Arquiteturas obrigatórias

- `docs/ARQUITETURA_ANTIFADIGA_ADAPTATIVA.md`: pensamento em árvore, repetição/novidade, loops abertos, relatórios sob demanda e autocorreção supervisionada.
- `docs/ARQUITETURA_CEREBRO_CRESCENTE_SOCIAL.md`: cérebro por modelos substituíveis, OpenAI dentro do Jarvis via API, radar de novidades, inteligência social, audiência e aprendizagem por resultados.

## Novo requisito central — Anti-Fadiga Adaptativa

O Jarvis deve resolver o problema de organização, não apenas acumular contexto. Deve acompanhar fala ramificada e repetitiva sem repreender a usuária, preservar o assunto-raiz quando surgirem galhos, extrair somente o que mudou, identificar loops abertos, contradições e decisões não consolidadas e devolver direção.

Princípios obrigatórios:

- repetição vira sinal interno de saliência/loop, não bronca;
- nunca dizer automaticamente “você já falou isso” ou expor contagem de repetição sem solicitação;
- manter mapa raiz → galhos → pendências → decisões → tarefas;
- quando houver desvio, preservar o fio principal e estacionar/relacionar o novo galho;
- separar fato relatado, decisão aprovada, hipótese, sugestão de IA e material importado;
- gerar relatórios de progresso operacional sem diagnosticar regressão clínica;
- aprender dialeto, jargões, sarcasmo, voz pública/privada/editorial/comercial por exemplos e correções versionadas;
- tornar a adaptação multiusuário configurável, sem copiar a configuração da Sol nem inferir diagnósticos;
- “autocorretivo” significa detectar bugs, reproduzir em sandbox, propor patch, testar, comparar e abrir PR; não editar produção sozinho.

## Cérebro crescente e autoatualização

O Jarvis deve manter memória, perfil, projetos e permissões próprios. O app ChatGPT não é embutido como sessão. Modelos OpenAI podem ser usados via API como cérebro principal ou especialista, junto com web search, file search, funções próprias, MCP e outras ferramentas disponíveis e autorizadas.

Criar `Capability Radar` periódico para acompanhar changelogs/documentação dos fornecedores usados, novos modelos, ferramentas, limites, preços, depreciações, SDKs e vulnerabilidades. Novidade não vira mudança automática: coletar → avaliar impacto → prototipar em branch/sandbox → testar → comparar → PR → promover por gates.

A inteligência cresce por memória corrigida, resultados observados, benchmarks, preferências, decisões consolidadas e ferramentas melhores; não por tratar qualquer inferência como verdade.

## Inteligência social e audiência

Conectar, mediante autorização, múltiplas contas profissionais do Instagram, Facebook Pages e TikTok. Começar em modo somente leitura: coletar métricas/insights permitidos, normalizar desempenho e aprender padrões de formato, tema, gancho, duração, CTA, horário e objetivo.

A usuária define o público desejado em termos estratégicos. O sistema traduz isso para critérios operacionais permitidos pelas plataformas, sem classificar indivíduos por inteligência, pobreza ou outras características sensíveis. Publicação e alterações de campanha entram depois, com escopos oficiais e aprovação adequada.

Relatórios pessoais e de organização ficam sob demanda por padrão. O Jarvis só interrompe com parecer espontâneo quando houver motivo operacional relevante, curto e justificável.

## Entrega de 9 de setembro — biblioteca de fontes e versões

### Implementado

- Catálogo de projetos incluindo Morte em Vida, Reposicione-se, Fuga Identitária, Feminicídio Emocional e Eu Não Desapareço, além de áreas pessoal, marca/negócios e geral.
- Importação explícita de texto colado, TXT ou Markdown UTF-8: até 160.000 bytes por fonte; não há leitura de PDF/DOCX nesta etapa.
- API privada autenticada/allowlist, sem uso de IA para importar e sem chave de modelo no navegador.
- Migração ADITIVA de documentos e trechos privados; escrita por função com `auth.uid()`, limites e bloqueio transacional por conta.
- Importação cria versão. Hash evita duplicação por repetição; versão-base evita sobreposição de revisões concorrentes. Reenviar uma versão antiga não a promove a atual.
- Conteúdo importado fica `imported_unverified`; não vira fato aprovado nem memória canônica automaticamente.
- Trechos mantêm documento, projeto, versão, checksum e posições no texto normalizado. Versões antigas permanecem registradas.
- Busca textual indexada em português em TODAS as fontes importadas; só a versão mais recente de cada fonte é usada por padrão. Não é busca semântica por embeddings.
- Chat privado integra os trechos e referências `[F1]` etc. A API devolve `knowledgeSources` com os excertos/locadores. A apresentação detalhada das referências por mensagem ainda precisa de integração na UI do chat; a biblioteca já lista as revisões.
- Modo público não lê a biblioteca nem grava fonte. A tela de fontes é desmontada ao entrar em modo público ou trocar de conta.
- Corrigida corrida da sessão inicial vs. evento novo de autenticação; painéis de memória/anúncios recebem chave por usuário para não reaproveitar estado de outra conta.

### Testes e limites

45 testes Node passaram localmente, incluindo os 24 anteriores e 21 novos. Identidade, rede e modelo são simulados nesses testes. Workflow adicional executa PostgreSQL 16 descartável, aplica a migração duas vezes e testa versões, duplicação, RLS, limites, posições Unicode e duas revisões concorrentes em conexões reais.
Consultar checks do commit atual para confirmar o resultado de CI; criar teste não significa executá-lo. Não foi usado conteúdo real da Sol nos testes automatizados. Nenhum livro foi importado automaticamente. Na entrega original desta biblioteca não havia comprovação de uso real em iPhone, geração com conta real ou banco Supabase de produção. Evidências posteriores de geração e do marcador fictício no celular estão no registro de 13/09/2026; não certificam a biblioteca completa, áudio ou câmera.

### Ativação controlada

A nova API fica desligada até `JARVIS_KNOWLEDGE_ENABLED=true` no servidor. Usa os mesmos dados de Auth e `JARVIS_ALLOWED_USER_IDS` do piloto, sem `service_role`. Aplicar a migração `202609090310_knowledge_sources.sql` somente em ambiente isolado primeiro. Quotas iniciais: 200 revisões/4 MiB de texto por conta. A biblioteca atual não oferece exclusão nem exportação integral; implementar política de retenção/exclusão/exportação antes de disponibilizar para clientes.
Se a biblioteca estiver desligada, o chat anterior não muda. Se ligada e indisponível, o chat emite aviso explícito de contexto incompleto em vez de inventar uma leitura. Não confundir login concluído com provedor ou cofre funcionando.

## Próxima entrega delimitada

Atualização de prioridade em 13/09/2026: a Sol já enviou o teste fictício e recebeu a recordação correta da capa azul. Não reiniciar esse roteiro. O bloqueio imediato é encontrar o Jarvis sem buscar links na conversa. Esta rodada adiciona acesso visível de instalação, ícones Apple/manifesto e testes, somente na branch do PR #6. Instalação no iPhone e sessão contínua não são comprovadas por CI. Queixas Q6–Q8 e modo de colaboração foram incorporados a `docs/QUEIXAS_E_ACEITE_MOBILE_2026-09-13.md`: o assistente assume a lista e a retomada, sem exigir que a Sol o lembre de lembrar. O mecanismo de tarefas duráveis dentro do produto ainda não está implementado.

1. Simplificar a tela principal para conversa + estado real + voz/encerrar; mover departamentos/fontes/integrações para Central secundária.
2. Implementar o primeiro núcleo Anti-Fadiga: tópico-raiz, galhos, repetição/novidade, loops abertos e delta de decisão, com armazenamento isolado e testes.
3. Criar `Model Router` e adaptador opcional para OpenAI Responses API, mantendo fallback atual e sem expor chave no navegador.
4. Apresentar `knowledgeSources` na mensagem do chat e acrescentar testes de navegador para troca público/privado/conta.
5. Criar o primeiro `Capability Radar` somente leitura, com registro de novidades e nenhuma autoimplantação.
6. Criar Social Intelligence Hub somente leitura começando por uma conta de teste/escopo por vez; depois expandir para múltiplas contas.
7. Validar biblioteca + conversa com contas reais de TESTE e autenticação Supabase; não remover proteção para passar no teste.
8. Implementar importação DOCX/PDF com pré-visualização e extração rastreável.
9. Consolidar decisões e tarefas com estado durável e aprovadores. Agentes ainda são perfis de resposta, não operadores autônomos.
10. Criar observabilidade/autocorreção segura: detecção → reprodução → branch → testes → PR → preview → aprovação/rollback.

## Exigências grandes ainda abertas

Wake word local/tela bloqueada, identificação de voz, interrupção natural, conversa audiovisual, live no mesmo telefone, tarefas 24h, ferramentas executoras, revisão clínica/jurídica adequada, clone autorizado e cobrança multiusuário. Não declarar concluídas por existir interface ou um teste simulado.

A arquitetura de voz futura pode usar detector local de wake word em cliente compatível e voz em tempo real; a solução exata só deve ser escolhida após prova no iPhone e análise de privacidade. Clone de voz/avatar fica em fase posterior com consentimento e biblioteca de identidade separada da memória íntima.

## Checkpoint adicional — multifacetas e prompt de execução (21/09/2026)

Pedido de Sol: acrescentar todas as informações novas à documentação do Jarvis, preservar o material anterior, confirmar a documentação das multifacetas e entregar um prompt para o que falta fazer.

Base conferida: `1355a9bc5c7d420b7c15139c609a2d051a50258f`, branch `work/audit-jarvis-ecosystem-20260918`, PR #8. A documentação anterior de multifacetas já existe em Produto e Visão, Skills e Interfaces e registries. O PR #8 está empilhado sobre outra branch de desenvolvimento; conferir HEAD e base antes de implementar ou integrar.

Complementos:
- [Mapa das multifacetas e da orquestração](JARVIS_MULTIFACETAS_E_ORQUESTRACAO.md): inventário completo dos 11 especialistas históricos, 13 Core Skills, 16 Skill Packs, perfis e roteamentos, sem confundir declaração com execução.
- [Requisitos integrais MM01–MM17](REQUISITOS_SOL_REFERENCIAS_LUCIDA_2026-09-21.md): espelho integral da fonte canônica de `universo-relacione-se`, com identificação de versão.
- [Prompt de execução](PROMPT_EXECUCAO_REFERENCIAS_MULTIFACETAS_LUCIDA.md): primeiro E1–E3 (referência, oportunidade, nove roteiros e conhecimento consultável pela LÚCIDA); depois E4–E7 (respostas, aprendizado, mentoria e novos galhos/resultados).

README, índice, arquitetura de skills e protocolo receberam apenas acréscimos para tornar o material encontrável. O texto anterior deste checkpoint e dos demais arquivos foi preservado. Registries, código, corpus, runtime, banco e produção não foram modificados nesta complementação.

Próxima sessão: ler o prompt completo, conferir o estado atual, inventariar o delta e implementar com evidências. Preservar as pendências anteriores; documentação nova não conclui voz, login, iPhone nem integrações. Fonte não acessada continua identificada como não verificada.


## Execução adicional E1–E7 — 21/09/2026

A implementação e a matriz MM01–MM17 estão em [ENTREGA_REFERENCIAS_LUCIDA_2026-09-21.md](ENTREGA_REFERENCIAS_LUCIDA_2026-09-21.md). Base preservada: PR #8, `f75f63988dbdc461af08067a4be55a0f9e828e89`. Há código para tarefas duráveis, roteiros, ponte editorial e continuidade consentida na LÚCIDA; os 234 testes do Jarvis e a compilação passaram localmente. A contraparte Magnetus3 passou 25 testes unitários e 22 de integração HTTP, incluindo os seis novos. Os dados e o provedor usados nessas provas são sintéticos.

Vídeo inicial não lido; aquisição audiovisual/ASR, voz Telegram, qualidade editorial real, navegador/iPhone e ativação externa continuam pendentes. Nenhum gate anterior foi fechado por esta entrega. Não houve migração remota, publicação, envio a clientes, novo gasto ou treinamento de pesos. Ler o relatório antes de retomar; não reduzir Jarvis às funções editoriais.


## Continuação de implementação — ASR e Telegram (21/09/2026)

[CONTINUACAO_ASR_TELEGRAM_2026-09-21.md](CONTINUACAO_ASR_TELEGRAM_2026-09-21.md) registra o delta sobre a PR #11: ASR CPU real de áudio curto com prova controlada, leitura de legendas públicas, transcrição Telegram consentida/revisável na contraparte e novas pautas com raiz/pai persistidos. O histórico acima conserva o estado observado na entrega anterior; a ausência de executor ASR daquela data foi superada localmente, sem afirmar ativação externa.

238 testes Node e build Jarvis; 25 testes históricos do estúdio mais quatro de limites de transcrição; Magnetus3 com 25 unitários e 25 de integração HTTP. A inferência real usou áudio sintético próprio; Telegram/modelo editorial nas integrações continuam controlados. Vídeo solicitado, cobertura visual, amostra executora de canal, catálogo/perfil aprovado, qualidade editorial real, navegador/iPhone e conexão externa continuam pendentes conforme a matriz MM01–MM17 atualizada.

Próxima execução: [PROMPT_CONTINUACAO_ASR_REFERENCIAS.md](PROMPT_CONTINUACAO_ASR_REFERENCIAS.md). Operação: [ASR_LOCAL_OPERACAO.md](ASR_LOCAL_OPERACAO.md). Nenhuma faceta foi removida e E1–E7 não foram declaradas integralmente homologadas.
