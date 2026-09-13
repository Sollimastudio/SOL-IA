# Jarvis / Sol.IA — continuidade verificável

## Ponto único de trabalho

Repositório: `Sollimastudio/SOL-IA`. Proposta ativa: PR #6, branch `work/jarvis-neural-conversa-segura-20260908`.
Esta etapa preserva a interface Neural e o núcleo seguro. Não criar outro Jarvis. Não sobrescrever `main`, aplicar migrações reais ou habilitar custos automaticamente.
Antes da continuação, ler este registro, a PR e seu HEAD real; comparar alterações concorrentes.

## Atualização 13/09/2026 — estúdio com a identidade da Sol

Ler `docs/ESTUDIO_IDENTIDADE_SOL.md` e `local_studio/README.md`. Sol esclareceu que quer ideia falada → roteiro → narração com sua voz → vídeo com seu rosto/expressões/gestos, sem gravar cada conteúdo, usando sua conta paga do ChatGPT e evitando novas despesas. Não reduzir esse objetivo a cofre de notas nem confundir assinatura com crédito API. Há agora código local para preparar referências, adaptar síntese em português e montar prévia estática; clonagem real, animação, gestos e ligação ao iPhone continuam pendentes de evidência. A segurança por dispositivo também permanece pendente; voz clonada não autentica a dona.

## Atualização 13/09/2026 — orçamento zero e abertura no iPhone

Ler `docs/ORCAMENTO_ZERO_VOZ_E_SEGURANCA.md`. Sol estabeleceu nenhum gasto novo agora. A geração remota fica pausada por padrão; captura e consulta do cofre passam a funcionar sem chamada de IA, com confirmação e ID estável para resolver envio ambíguo. Não confundir este modo com IA generativa local, nem franquia de hospedagem com recurso ilimitado. Voz local de leitura não é clonagem.

Sol confirmou abertura pelo ícone no iPhone e informou que houve login/envio de código nessa instância. Instalação confirmada por relato; sessão prolongada e proteção por biometria ainda pendentes. Novo requisito: impedir terceiros de operar como Sol sem repetir login por frase. Passkeys/verificação no dispositivo são o caminho a validar; voz não será credencial única. Nenhuma biometria ou configuração Auth adicional foi ativada nesta rodada.

## Atualização 13/09/2026 — engenharia assumida pelo produto

Ler `docs/PROGRAMA_DE_CONSTRUCAO_JARVIS.md` e o [adendo de requisitos](https://github.com/Sollimastudio/SOL-IA/pull/6#issuecomment-5654738092) antes de retomar. Contêm a sequência atual, testes de aceite, live no mesmo iPhone, preservação do legado e evolução solicitada dentro do Jarvis. A auditoria do passado continua parcial; não pedir que a Sol reconstitua tudo de memória.

A correção mais recente permite apontar repetição quando ajudar a reconhecer um ciclo e decidir, sem bronca nem contagem habitual. Relatórios completos permanecem sob demanda. Captura automática durável é objetivo pendente, não capacidade certificada.

O Prompt Autopilot anterior não estava ligado ao chat ativo. A versão `2026-09-13.1` passa a integrar a requisição ao modelo por `server/jarvis-chat.mjs`, com fonte única em `core/prompt-autopilot.mjs`; `promptVersion` identifica a versão na resposta da API. Testes com provedor simulado comprovam integração e limites, não qualidade semântica real. A próxima entrega estrutural é continuidade durável, conforme o procedimento do programa. Login/ícone continuam com pendência de aceite físico; não repetir o teste já recebido da capa azul.

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
