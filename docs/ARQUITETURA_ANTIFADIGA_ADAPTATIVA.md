# Jarvis / Sol.IA — Arquitetura Anti-Fadiga Adaptativa

## Problema que o produto deve resolver

O Jarvis não pode ser apenas um receptor de contexto cada vez maior. Ele deve reduzir a carga de organização da usuária quando a fala é ramificada, repetitiva, rápida, contraditória ou muda de assunto sem aviso. O sistema deve acompanhar a pessoa sem se perder com ela.

Objetivo de experiência: a usuária fala livremente; o Jarvis mantém o fio, identifica o que é novo, o que já existe, o que mudou, o que ficou pendente e qual é a próxima ação útil. Ele não repreende a usuária por repetir. Ele usa a repetição como sinal interno de saliência, dúvida, urgência, ansiedade operacional, decisão não consolidada ou ausência de conclusão — sem diagnosticar a causa.

Este mecanismo deve ser personalizável por usuário. Não pressupor neurodivergência, diagnóstico, incapacidade ou estado clínico a partir de comportamento, voz ou texto.

## 1. Mapa de pensamento em árvore

Cada entrada relevante deve ser decomposta em nós rastreáveis:

- assunto-raiz;
- subassuntos/galhos;
- fatos relatados;
- decisões já aprovadas;
- novas hipóteses;
- perguntas abertas;
- tarefas;
- materiais produzidos;
- assuntos estacionados;
- mudanças de direção;
- referências a projetos/documentos existentes.

O sistema deve manter relação pai/filho e links entre assuntos. Uma mudança de Goiânia para Japão no mesmo relato não apaga o ponto inicial: cria outro galho e preserva o retorno.

## 2. Pontuação silenciosa de repetição e novidade

O Jarvis deve calcular sinais internos, nunca como bronca:

- `similarity_score`: quão parecido o novo trecho é com material anterior;
- `novelty_score`: quanto de informação realmente nova apareceu;
- `decision_delta`: se a posição anterior mudou;
- `completion_delta`: se o assunto avançou ou apenas foi reaberto;
- `salience_score`: frequência + importância explícita + impacto em projetos;
- `contradiction_flag`: possível conflito entre versões, sem escolher uma como verdade sozinho;
- `open_loop_score`: tema recorrente que continua sem decisão/tarefa/conclusão;
- `branch_depth`: distância do assunto-raiz atual;
- `return_needed`: indica que a conversa desviou e ainda existe fio principal não fechado.

O usuário não recebe mensagens do tipo “você já falou isso 8 vezes”, salvo se pedir dados explícitos. O comportamento padrão é acolher a nova fala, extrair apenas o delta e reposicionar suavemente: “Entendi. O ponto novo aqui é X. O fio principal continua sendo Y; quer que eu conclua Y primeiro ou incorpore X agora?”

## 3. Anti-fadiga de contexto

Não reenviar toda a história para todo modelo. Criar camadas:

1. **Contexto quente** — últimas interações e tarefa atual.
2. **Estado do assunto** — resumo estruturado com raiz, galhos, decisões, pendências e versões.
3. **Memória relevante** — somente fatos/preferências/decisões recuperados pela consulta atual.
4. **Fontes** — trechos rastreáveis de documentos e projetos.
5. **Arquivo frio** — histórico completo consultado apenas quando necessário.

Antes de chamar um modelo caro, o sistema deve consolidar duplicatas sem apagar versões e enviar o menor contexto suficiente. Isso reduz custo, latência e “fadiga” do próprio agente.

## 4. Condutor de conversa

O Jarvis deve manter um `conversation_state` com:

- `root_topic`;
- `current_branch`;
- `open_branches`;
- `last_confirmed_decision`;
- `next_useful_action`;
- `waiting_for_user`;
- `waiting_for_agent`;
- `parking_lot`;
- `energy_mode` configurável pelo usuário (curto, normal, profundo), sem inferência clínica automática.

Regras:

- não perguntar novamente o que já está confirmado;
- não abandonar o assunto-raiz quando surge um galho;
- não forçar retorno imediato: estacionar o galho e continuar se a usuária quiser;
- resumir somente o delta quando houver repetição;
- quando houver contradição, mostrar as duas versões de forma neutra e pedir confirmação apenas se isso mudar a execução;
- quando o usuário disser “continue”, retomar o estado salvo, não reconstruir o projeto do zero.

## 5. Relatório de progresso sem julgamento

Relatórios devem medir projeto/comportamento operacional, não saúde mental.

Exemplos de métricas úteis por período:

- assuntos iniciados vs. concluídos;
- decisões consolidadas;
- loops reabertos;
- tarefas concluídas;
- ideias capturadas e transformadas em ativos;
- materiais produzidos/publicados;
- tempo entre ideia e primeira entrega;
- assuntos que mudaram de direção;
- proporção de conteúdo novo vs. repetição;
- projetos com avanço líquido;
- pendências antigas resolvidas.

O relatório pode dizer “houve mais avanço líquido nesta semana” ou “três temas foram reabertos sem conclusão”. Não pode diagnosticar regressão clínica. Se a usuária quiser usar a palavra “regredi”, o sistema deve explicitar se está falando de progresso operacional, de projeto ou de uma autoavaliação da própria usuária.

## 6. Dialeto, jargões e voz autoral

Criar perfil versionado e corrigível:

- expressões frequentes;
- palavras próprias, apelidos e pronúncias;
- sarcasmo preferido;
- nível de formalidade por contexto;
- ritmo de fala;
- frases proibidas ou que soam artificiais;
- diferença entre voz privada, voz pública, voz editorial e voz comercial;
- exemplos aprovados e rejeitados.

O sistema deve aprender por exemplos explícitos e correções. Nunca transformar uma inferência de estilo em regra permanente sem evidência suficiente. Manter histórico de alterações e permitir desfazer.

## 7. Personalização adaptativa para outros usuários

O produto comercial não deve copiar a configuração da Sol. Deve ter um perfil adaptativo com controles como:

- preferência por respostas curtas/longas;
- quantidade de perguntas de confirmação;
- nível de intervenção ao detectar desvio;
- sensibilidade a repetição;
- modo de organização (árvore, lista, cronologia, projeto);
- tom;
- voz;
- permissões de memória;
- horários e canais de alertas;
- acessibilidade e necessidades declaradas pelo próprio usuário.

A adaptação deve vir de escolhas, correções e comportamento observado com transparência, não de rótulos clínicos inferidos.

## 8. Sistema autocorretivo de software

“Autocorretivo” NÃO significa alterar produção sozinho.

Criar um ciclo seguro:

1. observar logs, métricas, falhas, testes e feedback;
2. detectar anomalias e regressões;
3. reproduzir o bug em ambiente isolado quando possível;
4. gerar hipótese e patch em branch própria;
5. executar testes unitários, integração, segurança e UI;
6. comparar resultado com baseline;
7. abrir PR com evidências;
8. permitir promoção somente se gates definidos passarem;
9. fazer canary/preview antes de produção;
10. permitir rollback rápido.

O Jarvis pode criar e testar correções automaticamente dentro desse sandbox. Mudanças de segurança, memória, cobrança, publicação, exclusão de dados ou produção exigem política de aprovação definida.

Também criar “self-checks” periódicos:

- endpoints quebrados;
- jobs parados;
- integrações expiradas;
- schemas divergentes;
- filas presas;
- custos anormais;
- memória sem fonte;
- respostas que alegam ações não executadas;
- queda na taxa de conclusão;
- aumento de repetição causada pelo próprio Jarvis;
- inconsistência entre interface e capacidade real.

## 9. Voz, wake word e conversa natural

Arquitetura desejada:

- detector local de wake word quando a plataforma permitir;
- “Jarvis” abre uma sessão de conversa;
- áudio da conversa só é enviado/processado durante a sessão autorizada;
- comando de encerramento fecha a sessão;
- indicação clara de microfone ativo;
- identificação de locutor como sinal adicional, não única autenticação para ações sensíveis;
- interrupção natural (barge-in);
- transcrição adaptada a nomes, projetos e jargões da usuária;
- resposta de voz com personalidade configurável.

A versão web atual de primeiro plano não satisfaz ainda wake word com tela bloqueada. Para essa experiência, avaliar cliente nativo/serviço compatível com iOS e/ou dispositivo dedicado sempre disponível, sem prometer capacidades não comprovadas.

## 10. Clone de voz e presença audiovisual

Etapa posterior, somente com consentimento e ativos autorizados:

- voz sintética baseada na própria usuária;
- biblioteca de imagens e vídeos autorizados;
- avatar/digital twin para conteúdo;
- scripts produzidos pelo Jarvis usando o perfil autoral aprovado;
- marcação interna da origem do material;
- controles separados para “rascunhar com minha voz” e “publicar em meu nome”.

Nunca usar o clone para fabricar testemunho pessoal, aprovação ou evento que a usuária não tenha autorizado.

## 11. Interface: complexidade escondida, controle acessível

Tela principal:

- Jarvis;
- estado real (disponível / ouvindo / trabalhando / precisa de você);
- um campo/conversa;
- um botão de voz enquanto wake word não estiver comprovado;
- botão claro de encerrar;
- no máximo uma recomendação/ação principal por vez.

Todo o resto fica em “Detalhes” / “Central”:

- projetos;
- agentes;
- fontes;
- memória;
- tarefas;
- integrações;
- relatórios;
- configurações.

O usuário não deve escolher agente para tarefas comuns. O roteador coordena especialistas internamente.

## 12. Ordem de implementação

1. Motor de tópico/ramificação + repetição/novidade + loops abertos.
2. Estado durável de conversa/projeto e retorno ao assunto-raiz.
3. Relatório operacional de progresso.
4. Perfil de dialeto/tom corrigível e versionado.
5. Interface simples, escondendo organograma e detalhes técnicos.
6. Agentes com ferramentas e trilha de execução.
7. Observabilidade + pipeline autocorretivo em branch/preview/testes.
8. Realtime voice, wake word, identificação de locutor e cliente apropriado.
9. Vídeo/live e biblioteca pública separada.
10. Clone autorizado e produto multiusuário.

## Critério de sucesso

O Jarvis só cumpre esta proposta quando uma pessoa puder despejar pensamentos desorganizados por dias ou meses e o sistema continuar sabendo: qual era a raiz, o que realmente mudou, o que já foi decidido, o que está pendente, qual é o próximo passo e o que pode ser executado — sem fazer a pessoa carregar o peso de organizar o próprio assistente.