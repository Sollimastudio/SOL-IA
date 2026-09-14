# Jarvis — Inteligência Crescente e Capability Radar

Atualização: 14/09/2026.

## O que esta camada resolve

O Jarvis não pode congelar a inteligência no dia em que o código foi escrito. Ao mesmo tempo, “usar sempre a novidade” seria perigoso: plataformas mudam, rumores circulam, modelos novos podem ser mais caros ou piores para uma tarefa específica.

Esta entrega separa quatro processos:

1. **detectar novidade** em fontes oficiais;
2. **validar evidência e frescor**;
3. **testar impacto em sandbox/benchmark**;
4. **promover somente a melhoria comprovada**.

O Capability Radar não altera produção, modelo, estratégia ou orçamento sozinho.

## O que entrou no produto

- `core/growth-intelligence.mjs`: política de crescimento contínuo, janelas de frescor, validação de melhor horário e gate de promoção de modelos.
- `scripts/capability-radar.mjs`: verifica fontes oficiais sem modelo de IA nem chave paga, produz hash e detecta mudança desde a observação anterior.
- `config/capability-radar-sources.json`: registro explícito das fontes permitidas.
- `.github/workflows/jarvis-capability-radar.yml`: execução diária e manual; restaura o último estado por cache, gera relatório e preserva artefato para revisão.
- `tests/growth-intelligence.test.mjs` e `tests/capability-radar.test.mjs`: regras contra horários inventados, evidência velha, promoção automática de modelo e falso “algoritmo mudou”.
- `api/jarvis-chat.ts`: a política de crescimento foi ligada ao contexto real da conversa junto de Presença Sol, Inteligência de Audiência e Continuidade.

## Fonte > rumor

Hierarquia operacional:

1. documentação/changelog oficial;
2. dados reais da conta da Sol;
3. experimento controlado próprio;
4. fonte técnica independente;
5. relato de criador/comunidade como pista, nunca como atualização confirmada.

Uma mudança de hash em uma página oficial significa **“revisar”**, não “mudar estratégia”. Páginas podem mudar por razões irrelevantes.

## Algoritmos sociais

Não existe uma fórmula pública única que garanta viralização ou permita escolher diretamente “quem verá”. O Jarvis deve tratar ranking como sistema adaptativo e aprender com os sinais permitidos pela plataforma e com os resultados reais da conta.

Princípios oficiais úteis no estado atual:

- Instagram/Meta: conteúdo elegível/original e resposta inicial da audiência têm papel nas recomendações; Meta descreveu distribuição inicial para uma audiência pequena e expansão dos conteúdos que performam melhor. Fonte: https://about.fb.com/br/news/2024/04/ajudando-o-criador-de-conteudo-a-encontrar-novos-publicos/
- Facebook/Meta: em março de 2026 a Meta reforçou maior distribuição/monetização de conteúdo original e redução de conteúdo não original. Fonte: https://about.fb.com/br/news/2026/03/recompensando-criadores-originais-no-facebook/
- TikTok: o For You é personalizado por sinais de interesse e interação e continua sendo ajustado pelo comportamento do usuário. Fontes: https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en e https://support.tiktok.com/en/getting-started/for-you

Esses princípios não viram “receita secreta”. O Radar existe porque o estado atual pode mudar.

## Horário e “picos emocionais”

Não foi aceita como regra a ideia de uma tabela universal do tipo “manhã = reflexão, tarde = raiva”. Não há base suficiente para endurecer isso no produto como verdade.

O Jarvis deverá testar **na audiência real** combinações de:

- faixa horária;
- emoção predominante do conteúdo;
- tema;
- formato;
- gancho;
- CTA/oferta;
- objetivo (alcance, comunidade, lead, venda, retenção etc.).

Se uma ferramenta de “melhor horário” retornar apenas zeros ou não houver rede conectada, o sistema responde **“dados insuficientes”**, não inventa um horário.

Na verificação de 14/09/2026, a conta Metricool conectada ao ChatGPT retornou a matriz de melhores horários do Instagram totalmente zerada. Portanto ainda não existe evidência de melhor horário da Sol por essa fonte.

## Modelos sempre atuais, sem trocar por moda

O Radar acompanha lançamentos e depreciações, mas modelo novo entra primeiro como candidato.

Benchmark mínimo por tarefa:

- qualidade/aderência;
- continuidade/contexto;
- capacidade de ferramenta;
- latência;
- estabilidade;
- privacidade;
- custo.

A promoção só acontece se superar os gates definidos. “Mais novo” não é critério suficiente.

Como exemplo de por que o Radar é necessário: as páginas oficiais da OpenAI consultadas em 14/09/2026 já listavam GPT-6 Astra (03/09/2026) e GPT-Live-1 na API (10/09/2026), posteriores a vários modelos mencionados na arquitetura original. Fontes: https://openai.com/research/index/release/ e https://help.openai.com/en/articles/9624314-model-release-notes

Isso **não** significa que o Jarvis trocou automaticamente para esses modelos ou que são os melhores/cabem no orçamento atual.

## Loop de evolução da Sol

Para cada conteúdo relevante, a evolução desejada é:

**hipótese → publicação → métricas → resultado comercial/comunitário → comparação → aprendizado → próxima hipótese.**

O sistema deve aprender qual combinação funciona para cada objetivo. Viral não é sinônimo de bom; conteúdo menor que gera compradores ou membros duráveis pode vencer.

## Próximos conectores necessários

O Radar tecnológico já pode rodar no GitHub. O aprendizado social real depende de conectar dados das redes. A Metricool foi conectada ao ChatGPT, mas no momento consultado ainda não havia dados úteis de redes para melhor horário. Quando Instagram/TikTok/Facebook estiverem efetivamente conectados, o Social Intelligence Hub deverá trazer métricas para o mesmo ciclo.

Dados de venda/assinatura também precisam ser conectados para distinguir “engajou” de “comprou/renovou”.

## Regra operacional

**Novidade é sinal. Evidência é aprendizado. Benchmark é promoção. Resultado real é autoridade para mudar o padrão.**
