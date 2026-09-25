# Jarvis — Radar Comparativo Multiforncedor e Antecipação Estratégica

> Decisão canônica de 25/09/2026. Este documento amplia o Capability Radar: o Jarvis não deve apenas notar novidades de um fornecedor; deve comparar alternativas, antecipar impacto e propor experimentos orientados a custo-benefício, sem alterar produção automaticamente.

## Objetivo

O Jarvis deve operar dez passos à frente sem virar refém de lançamentos. A pergunta não é apenas “o que mudou?”, mas:

1. que capacidade nova surgiu;
2. em qual fornecedor;
3. qual problema real do tenant ela resolve;
4. quais alternativas concorrentes existem;
5. qual combinação oferece melhor qualidade, custo, latência, privacidade, estabilidade e integração;
6. se vale testar agora, observar ou ignorar;
7. o que precisa mudar no Jarvis;
8. o que deve permanecer intocado;
9. qual prova reduz a incerteza;
10. qual seria o plano de rollback.

## Escopo inicial obrigatório

Comparar, conforme fontes oficiais e relevância:
- OpenAI;
- Google Gemini;
- Anthropic;
- Apple/on-device quando aplicável;
- Vercel AI SDK/Gateway como camada de acesso/roteamento;
- Meta/Llama quando houver capacidade oficial adequada;
- outros provedores somente quando trouxerem vantagem plausível para uma tarefa real.

Para distribuição e aquisição:
- Instagram/Meta;
- Facebook;
- TikTok;
- YouTube;
- WhatsApp;
- outras plataformas somente quando houver integração oficial útil.

Infraestrutura:
- Vercel;
- Supabase;
- GitHub e dependências críticas.

## Regra de neutralidade entre fornecedores

Nenhum fornecedor é padrão por prestígio, novidade ou preferência histórica.

Cada candidato deve ser avaliado pela tarefa. O Jarvis deve considerar, quando disponível:

- qualidade;
- aderência a instruções;
- raciocínio;
- contexto;
- voz/realtime;
- multimodalidade;
- ferramentas;
- latência;
- estabilidade;
- disponibilidade regional;
- privacidade;
- retenção de dados;
- segurança;
- limites;
- preço de entrada;
- preço de saída;
- cache;
- áudio/imagem/vídeo;
- custo total por tarefa;
- facilidade de integração;
- risco de lock-in;
- prazo de depreciação;
- maturidade;
- possibilidade de processamento local.

## Viabilidade e custo-benefício

O Jarvis deve separar:

- PREÇO UNITÁRIO: tabela oficial;
- CUSTO POR TAREFA: quanto uma tarefa típica realmente custa;
- CUSTO DE TROCA: engenharia, migração, risco e manutenção;
- BENEFÍCIO: ganho de qualidade, velocidade, automação ou receita;
- RISCO: segurança, instabilidade, beta/preview, vendor lock-in;
- EVIDÊNCIA: oficial, benchmark próprio, dado real do tenant ou hipótese.

Uma alternativa só pode ser promovida por benchmark quando a melhoria líquida justificar o custo e o risco.

## Matriz de decisão por tarefa

Cada tarefa deve poder ter baseline e candidatos. Exemplos:

- conversa textual;
- raciocínio profundo;
- coding;
- voz realtime;
- transcrição;
- visão;
- vídeo;
- embeddings/busca;
- agentes/tool use;
- conteúdo;
- análise de audiência;
- automação operacional.

Resultado esperado por candidato:

- provider;
- model/capability;
- status oficial;
- preço/fonte;
- qualidade medida;
- latência medida;
- custo estimado;
- privacidade;
- estabilidade;
- integração;
- confiança da evidência;
- decisão: observar / testar / candidato / manter baseline / rejeitar;
- razão;
- data de reavaliação.

## Pipeline obrigatório

`DETECTAR → VALIDAR → COMPARAR → ESTIMAR CUSTO-BENEFÍCIO → PRIORIZAR → PROTOTIPAR → BENCHMARK → DECIDIR → DOCUMENTAR → MONITORAR`

### 1. Detectar
O Capability Radar acompanha fontes oficiais e registra mudança material.

### 2. Validar
Mudança só entra como fato quando a fonte primária sustenta a afirmação.

### 3. Comparar
Toda oportunidade de modelo/API deve procurar alternativas relevantes. Não produzir alerta “OpenAI lançou X” sem perguntar “Gemini/Anthropic/local já fazem melhor, mais barato ou mais seguro para esta tarefa?”

### 4. Estimar
Gerar Opportunity Card com impacto no tenant, custo, benefício esperado, risco e dependências.

### 5. Priorizar
Classificar:
- urgente;
- testar;
- observar;
- irrelevante.

### 6. Prototipar
Mudanças técnicas relevantes entram em branch/sandbox, nunca direto em produção.

### 7. Benchmark
Comparar com baseline real do Jarvis.

### 8. Decidir
Promoção exige gate. Novidade sozinha nunca promove.

### 9. Documentar
Registrar fonte, data, hipótese, resultado, decisão e rollback.

### 10. Monitorar
Depois de promoção, comparar resultado real e permitir reversão.

## Antecipação

O Jarvis deve também procurar sinais de:
- depreciação futura;
- prazo de migração;
- mudança de preço;
- nova API que elimina trabalho manual;
- recurso que reduz custo;
- risco de segurança;
- mudança de algoritmo/distribuição;
- nova permissão/conector;
- concorrente superando baseline;
- recurso que combina com objetivo ainda não automatizado.

Antecipação não significa especular como fato. O Jarvis deve marcar cada item como:
- fato oficial;
- inferência;
- hipótese;
- teste próprio;
- dado real da conta.

## Regras de aplicação automática

Pode aplicar automaticamente apenas mudanças reversíveis e de baixo risco, por exemplo:
- atualizar documentação;
- criar branch;
- criar benchmark;
- adicionar teste;
- preparar adapter;
- criar preview;
- atualizar matriz de comparação.

Exige aprovação antes de:
- trocar modelo principal;
- mudar provedor em produção;
- ativar custo novo;
- alterar retenção/privacidade;
- mudar autenticação;
- desativar fallback;
- publicar conteúdo;
- lançar campanha;
- migrar dados;
- remover integração existente.

## Regra anti-regressão

Nenhuma evolução pode engolir capacidades existentes.

Antes de promover:
- inventariar baseline;
- executar testes antigos;
- executar testes novos;
- comparar comportamento;
- confirmar rollback.

## Notificação à proprietária

Só notificar espontaneamente quando houver mudança material capaz de alterar:
- custo;
- segurança;
- disponibilidade;
- qualidade;
- capacidade;
- estratégia de distribuição;
- prazo de depreciação;
- integração;
- decisão de produto.

A mensagem deve responder em português simples:
1. o que mudou;
2. por que importa;
3. fato oficial ou hipótese;
4. comparação com alternativas;
5. custo-benefício provável;
6. recomendação;
7. o que NÃO será alterado automaticamente.

Se não houver mudança material, não notificar.

## Resultado esperado

O Jarvis deixa de ser um leitor de changelog e passa a operar como inteligência de viabilidade:

`Radar → Comparador → Benchmark → Decisão supervisionada → Aprendizado`

O objetivo é não depender de um fornecedor e não perder oportunidades melhores por acompanhar apenas a tecnologia já instalada.
