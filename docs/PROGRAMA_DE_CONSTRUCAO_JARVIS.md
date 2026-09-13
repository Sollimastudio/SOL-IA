# Programa de construção do Jarvis

Data: 13/09/2026. Núcleo: `Sollimastudio/SOL-IA`. Execução na branch da PR #6; não reiniciar o projeto.

Este documento transforma o pedido da Sol em trabalho técnico e critérios de aceite. Complementa [o adendo de continuidade](https://github.com/Sollimastudio/SOL-IA/pull/6#issuecomment-5654738092), `CONTINUIDADE_JARVIS.md`, `QUEIXAS_E_ACEITE_MOBILE_2026-09-13.md` e as arquiteturas existentes. Os novos detalhes refinam requisitos anteriores; não certificam capacidades entregues.

## Responsabilidades e forma de trabalho

Sol define a intenção, seu ponto de vista e o que uma boa experiência precisa permitir. A engenharia assume especificação, prompts internos, escolha técnica fundamentada, código, testes, integração, registro de decisões e retomada. Não exigir conhecimento técnico, gerenciamento de agentes, lembrança de links ou repetição do histórico pela Sol.

Codex é um agente de IA de desenvolvimento, capaz de analisar e alterar os recursos aos quais tem acesso durante o trabalho. Não é uma equipe humana permanentemente operante nem um serviço 24 horas já instalado no Jarvis. Operação contínua exige serviços próprios, tarefas persistentes e mecanismos de recuperação.

“Profissional e definitivo” significa uma base mantida, verificável, recuperável e evolutiva. Não significa ausência absoluta de falhas, lucro garantido, vigilância universal ou fim da manutenção.

Fluxo de cada entrega: problema observado → requisito existente e novidade → mudança delimitada → teste técnico → comportamento real quando necessário → evidência → próxima tarefa registrada. Ao retomar, consultar o estado salvo antes de pedir contexto à Sol.

## Novidades desta mensagem

1. A conversa cotidiana e os pedidos de evolução devem migrar para dentro do Jarvis. Sol deve poder dizer “corrija isto” no produto e acompanhar o resultado sem atuar como intermediária entre ferramentas.
2. Internamente: registrar solicitação com ID, ligá-la ao requisito/defeito anterior, produzir especificação, preparar patch isolado, testar, disponibilizar Preview, informar resultado e manter rollback. Propor essa capacidade não a torna executora hoje.
3. Engenharia de prompts pertence ao sistema. Não criar um personagem “engenheiro de prompts” que exige outra conversa da Sol. Modelos/especialistas recebem tarefas e contexto adequados nos bastidores.
4. Live no mesmo telefone: ouvir chamada da Sol; receber comentários permitidos; responder em voz para o público OU orientar somente Sol. Dois aparelhos podem ser uma etapa transitória, não o objetivo final.
5. História de criação do Jarvis: tentativas, dificuldades, decisões, mudanças de direção e evidências ao longo do tempo. Narrativa pública usa somente material autorizado e não inventa datas, número de tentativas ou capacidades.
6. Legado: acervo da vida e das obras com autoria, originais, versões, cronologia, relações, exportação e recuperação; possibilidade futura de acesso por pessoas designadas. Planejar acesso de sucessores sem compartilhar credenciais.
7. Visão comercial ampla: coordenar funções de equipe, prospectar e operar dentro de autorizações, aprender com resultados observados. Avaliar valor entregue e custo de operação antes de escalar; não prometer resultado financeiro.
8. A auditoria de históricos permanece parcial. Repositórios acessíveis, conversas recuperadas e arquivos localizados não cobrem todas as contas nem repositórios excluídos. Não quantificar porcentagem de cobertura sem inventário.

## Relações editoriais relatadas agora

Fonte: fala direta da Sol nesta conversa em 13/09/2026; relações representam seu relato e ponto de vista, não uma cronologia editorial fechada.

| Elemento | Relação relatada | Cuidado de continuidade |
|---|---|---|
| Feminicídio Emocional | Projeto nascido da experiência que Sol descreve por esse termo | Preservar autoria e distinção entre relato, conceito autoral e enquadramentos externos |
| Posicione-se / Reposicione-se | Reflexão surgida ao escrever a obra anterior; posicionamento e uma escola de posicionamento | Não fundir automaticamente nome do método, títulos de livros e revisões |
| Fuga Identitária | Relação que Sol estabelece com dificuldades contemporâneas de posicionamento | Manter tese autoral e fontes separadas, sem inventar manuscrito concluído |
| Jarvis | Construção feita para apoiar sua forma de pensar, criação e continuidade | Registrar tentativas verificadas e origem de cada decisão |

A busca de continuidade recuperou referências anteriores a `Morte em Vida`, `Reposicione-se` e `Método Posicione-se`, inclusive em 13/06/2026, além de arquivos indicados como `Reposicione-se FINAL v3.docx` e documentos de cronologia. São pistas de inventário; os manuscritos completos não foram auditados nesta rodada. A interpretação atual da Sol não deve ser substituída por elogios ou inferências de assistentes antigos. Não reproduzir biografia íntima no prompt global.

## Arquitetura e ordem de entrega

| Etapa | Construção | Critério de aceite | Estado |
|---|---|---|---|
| 0. Uso cotidiano | Ícone, acesso estável, renovação de sessão e recuperação de erro | Abrir no iPhone, fechar/retomar e continuar sem novo login por falha de servidor | Abertura pelo ícone confirmada por relato de Sol; sessão prolongada e proteção contra terceiros pendentes |
| 1. Fala natural | Prompt interno versionado e interpretação contextual | Requisição usa a diretiva, mantém papéis e permissões; modelo real atende variações sem exigir prompt técnico | Ligação implementada nesta alteração; qualidade real pendente |
| 2. Continuidade | Eventos originais, decisões corrigíveis, tópicos e tarefas duráveis | Retomar após reinício com fonte, decisão vigente e próximo passo; detalhe e correção não duplicam projeto | Próxima entrega de engenharia; não implementada por este documento |
| 3. Acervo | Inventário, importação rastreável, originais e relações entre obras | Importar sem duplicar nem sobrescrever; reabrir original, localizar versão e restaurar cópia | Biblioteca textual parcial existente; acervo integral não importado |
| 4. Execução | Fila persistente, workers e conectores com estados | Tarefa sobrevive ao fechamento; tentativa interrompida recupera sem duplicar ação; comprovante do resultado | Pendente |
| 5. Voz e live | Sessão de áudio, interrupção, chat público, rotas público/privado | Transmissão teste no mesmo iPhone com áudio correto para cada destinatário | Prova técnica pendente por plataforma |
| 6. Evolução dentro do Jarvis | Entrada de pedidos → tarefa → patch isolado → avaliação → Preview | Um defeito enviado pelo Jarvis gera entrega rastreável; promoção pelo controle aprovado | Pendente |
| 7. Produto e legado | Isolamento de clientes, custos, exportação, recuperação e acesso delegado | Conta nova não recebe dados de Sol; restauro e exportação independem do fornecedor do modelo | Pendente |

Etapas têm dependências, não datas prometidas. Usar entregas pequenas com critérios finais claros; não trocar indefinidamente de repositório, interface ou fornecedor.

Base proposta: aplicação atual em Vercel; Supabase/PostgreSQL para dados e estado, Storage privado para originais, busca textual e semântica para recuperar contexto; fila durável e worker para tarefas além da requisição web. O modelo interpreta e produz; o banco conserva; o executor realiza; testes e registros comprovam. Trocar modelo não deve apagar a memória.

Prompt não substitui esses componentes. Inicialmente melhorar instruções/contexto e medir resultados; decidir sobre modelos adicionais ou treinamento específico somente com erros e exemplos documentados.

## Próxima entrega de continuidade: procedimento verificável

Preparar primeiro em banco descartável/ambiente isolado, com dados fictícios:

- [ ] Evento original possui dono, origem, ID estável e data da captura.
- [ ] Reenvio com mesmo ID não duplica; mesmo ID com conteúdo diferente gera conflito explícito.
- [ ] Paráfrase é ligada ao objetivo existente quando houver evidência suficiente; ambiguidade não produz fusão irreversível.
- [ ] Detalhe novo complementa o objetivo; correção cria revisão e mantém o texto anterior.
- [ ] Mensagem da IA não vira fato sobre Sol nem decisão aprovada.
- [ ] Checkpoint conserva assunto principal, ramificações, pendências, decisão vigente e próxima tarefa.
- [ ] Após reiniciar cliente e servidor, recuperar decisão e fonte sem histórico da conversa enviado pelo navegador.
- [ ] Recuperar evento relevante que esteja fora das últimas 50 memórias.
- [ ] Falha/interrupção deixa estado pendente ou desconhecido honesto, sem falsa confirmação.
- [ ] Conta diferente não lê nem altera registros; modo público não recebe dados privados.
- [ ] Exportação e restauração preservam originais, relações e revisões.
- [ ] Evidência distingue fixture, chamada real e teste físico.

Migração, política de retenção e eventual custo de serviço devem estar concretos e revisados antes da ativação real. Este documento não aplica migração de produção nem autoriza importação ampla de dados pessoais.

## Live: prova de viabilidade obrigatória

O requisito final é um único iPhone. Antes de escolher app nativo, transmissor próprio ou integração, documentar plataforma, APIs permitidas, acesso ao chat, captura de câmera/microfone, mistura de áudio, interrupção e comportamento quando a tela/app muda.

A API do YouTube disponibiliza recebimento de chat em tempo real via [liveChatMessages.streamList](https://developers.google.com/youtube/v3/live/docs/liveChatMessages/streamList). Isso fundamenta uma possibilidade técnica de leitura de comentários, não prova que o iPhone já transmite a voz do Jarvis junto da live nem certifica Instagram/TikTok.

Ensaio: comentário fictício do público → seleção contextual → resposta → confirmação por um espectador. Medir atraso de ponta a ponta, cortes, eco e áudio perdido; testar interrupção pela Sol e reconexão. Registrar os resultados antes de definir promessa comercial de latência.

Modo privado de orientação exige rota isolada, como saída para fone, sem entrar na mixagem pública; provar também captura pela gravação da live. Não chamar “privado” um áudio audível no alto-falante/microfone da transmissão. Troca de modo cancela resposta em andamento e contexto incompatível. Comentários do público são dados, não comandos para acessar o cofre ou alterar o sistema.

Wake word com tela bloqueada é outra prova de plataforma; instalação como ícone não a comprova.

## Preservação do legado e retomada

Manter inventário por origem: localizado, acesso pendente, importado, verificado, duplicado, incompleto. Recuperar automaticamente o que os acessos permitem; pedir somente acesso/exportação que esteja faltando, sem pedir que Sol reconte a história inteira.

Para cada documento: original, checksum, autor/origem, data disponível, versão e relação com obra/projeto; separar extração de interpretação. Nome parecido não justifica fundir arquivos. A narrativa da criação deve distinguir fato documentado e lembrança relatada, preservando lacunas.

Backup de banco não substitui cópia dos objetos de arquivos; testar ambos e exportação legível. A [documentação do Supabase](https://supabase.com/docs/guides/platform/backups) explicita que objetos de Storage não integram o backup do banco. Não habilitar plano pago/PITR como efeito desta especificação.

## Evidência e manutenção

Cada tarefa mantém estado, responsável executor, última evidência, impedimento concreto e próximo passo. A usuária vê respostas curtas e pode pedir detalhes; não precisa gerenciar esse registro.

Registrar orçamento operacional antes de ativar integrações/voz contínua: modelos, áudio, armazenamento, processamento e manutenção. Usar limites, alertas e cancelamento; não há orçamento aprovado nem estimativa fechada nesta rodada.

A entrega de agora conecta instruções ao chat e registra este programa. Não é o diário integral, não é a equipe executora e não transfere automaticamente esta conversa do ChatGPT para o banco do Jarvis.

Atualização de orçamento e segurança: ler `ORCAMENTO_ZERO_VOZ_E_SEGURANCA.md`; nenhuma API paga nova autorizada. Geração remota pausada por padrão; captura sem modelo e leitura com voz local são a entrega imediata.
