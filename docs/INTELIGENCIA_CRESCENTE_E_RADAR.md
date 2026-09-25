# Jarvis — Inteligência Crescente e Radares

> Atualizado em 25/09/2026. O Radar global agora inclui comparação multifornnecedor e custo-benefício por tarefa. Ler também `RADAR_COMPARATIVO_MULTIFORNECEDOR_2026-09-25.md`.

## 1. O problema

Jarvis não pode congelar a inteligência no dia em que o código foi escrito. Ao mesmo tempo, “usar sempre a novidade” seria perigoso: plataformas mudam, rumores circulam, modelos novos podem ser mais caros/piores e tendências podem ser irrelevantes para determinado cliente.

A solução separa processos:

1. detectar sinal;
2. validar evidência/frescor;
3. classificar escopo/impacto;
4. cruzar com objetivos/ativos;
5. testar quando necessário;
6. promover/recomendar somente com evidência.

Nenhum Radar altera produção, estratégia, orçamento ou publicação sozinho.

## 2. Capability Radar global

O Radar global existe para manter **o próprio Jarvis** atual.

Monitora fontes oficiais relevantes a:

- modelos de IA;
- APIs;
- SDKs;
- depreciações;
- preço/limites;
- voz/visão/vídeo;
- agentes/ferramentas;
- segurança;
- Vercel/Supabase/infraestrutura;
- Meta/TikTok/YouTube e outras integrações usadas;
- dependências críticas.

Componentes do piloto incluem:

- `core/growth-intelligence.mjs`;
- `scripts/capability-radar.mjs`;
- `config/capability-radar-sources.json`;
- workflow dedicado no GitHub;
- testes contra falso “algoritmo mudou” e promoção automática.

Mudança de hash em página significa **revisar**, não “adotar”.

## 3. Radar de Domínio por tenant

Cada cliente pode configurar outro tipo de Radar: o que acompanha o **mundo relevante para seus objetivos**.

Exemplos:

### Creator

- redes;
- formatos;
- assuntos;
- audiência;
- produtos;
- creator economy;
- concorrência/referências.

### Agência

- mudanças das plataformas;
- tendências;
- oportunidades/ameaças;
- concorrência;
- comportamento por segmento;
- quais clientes têm encaixe real com um sinal.

### Empresa

- mercado;
- clientes;
- concorrentes;
- custos;
- fornecedores;
- tecnologia;
- produto;
- regulamentação quando aplicável;
- riscos operacionais.

O Radar global pode descobrir algo uma vez. A relevância é calculada separadamente por tenant/workspace/cliente.

## 4. Fonte > rumor

Hierarquia geral:

1. documentação/fonte oficial;
2. dados reais autorizados do tenant;
3. experimento controlado próprio;
4. fonte técnica/mercado independente confiável;
5. comunidade/criadores como pista, não confirmação final.

Para tendências culturais, fontes de comunidade podem ser sinal importante, mas alegações factuais ainda precisam de verificação compatível.

## 5. Plataformas sociais

Não existe fórmula pública única que garanta viralização.

Jarvis deve aprender com:

- regras/documentação oficial;
- dados da conta real;
- experimentos;
- retenção/interação;
- cliques/leads;
- vendas/resultado final.

Princípios oficiais já acompanhados no piloto incluíram originalidade/elegibilidade de conteúdo e personalização do For You. Esses princípios podem mudar; o Radar existe justamente para detectar isso.

## 6. Horário e padrões da audiência

Não endurecer tabelas universais como verdade.

Testar no tenant real:

- faixa horária;
- tema;
- formato;
- emoção/tom quando aplicável;
- gancho;
- CTA;
- objetivo;
- plataforma;
- público/segmento permitido.

Se dados retornarem zeros/insuficientes, responder **dados insuficientes**.

## 7. Modelos sempre atuais, sem trocar por moda

Novo modelo entra como candidato.

Benchmark por tarefa pode considerar:

- qualidade;
- aderência;
- contexto/continuidade;
- ferramentas;
- multimodalidade;
- latência;
- estabilidade;
- privacidade;
- custo;
- disponibilidade;
- compatibilidade com política do tenant.

“Mais novo” não é critério suficiente.

## 8. Roteamento por tenant

Um modelo pode ser ideal para um cliente e inadequado para outro.

Exemplo:

- Tenant A prioriza privacidade/local;
- Tenant B prioriza latência;
- Tenant C autoriza premium;
- Tenant D opera com limite rígido de custo.

O Model Router deve obedecer a política do tenant antes de “otimizar” por conta própria.

## 9. Loop de aprendizado de resultado

Formato genérico:

`hipótese → ação/publicação → métricas → resultado → comparação → aprendizado → próxima hipótese`

Resultado varia:

- creator: audiência/lead/venda;
- agência: performance/margem/retenção do cliente;
- empresa: receita, custo, qualidade, prazo, risco;
- software: ativação/retenção/incidente;
- indivíduo: avanço de projetos/objetivos.

## 10. Tendência → Ativo → Resultado

O Radar de Domínio alimenta `LOOP_CONTINUO_TENDENCIA_PARA_RECEITA.md`.

O nome histórico “receita” permanece porque nasceu no piloto Sol, mas a arquitetura agora entende **resultado** de forma parametrizada.

A pergunta deixa de ser apenas “como vender isso?” e passa a ser:

> “Isso muda alguma coisa relevante para o objetivo deste tenant e qual ativo/ação pode capturar valor ou reduzir risco?”

## 11. Anti-fadiga do Radar

Um sistema que acompanha tudo não pode falar tudo.

Notificar por padrão somente quando houver:

- mudança material;
- risco;
- custo;
- oportunidade com alto encaixe;
- prazo curto;
- informação que altera decisão;
- falha no próprio Jarvis.

O resto vira registro silencioso para comparação futura.

## 12. Personalização e isolamento

Radar deve carregar:

- `tenant/workspace/client`;
- objetivos/KPIs;
- fontes permitidas;
- ativos ligados;
- histórico de decisões;
- resultado posterior.

Uma tendência relevante para Cliente A de uma agência não deve virar recomendação automática para Cliente B.

## 13. Evolução do próprio Jarvis

Quando o Radar global encontra nova capacidade:

```text
sinal
→ validação
→ comparação com estado atual
→ custo/benefício
→ branch/sandbox
→ testes/benchmark
→ Preview
→ aprovação/política
→ promoção
→ rollback
```

Autodesenvolvimento não significa produção sem controle.

## 14. Regra operacional

**Novidade é sinal. Evidência é aprendizado. Benchmark é promoção. Resultado real é autoridade para mudar o padrão. Escopo correto impede que inteligência vire confusão entre clientes.**
