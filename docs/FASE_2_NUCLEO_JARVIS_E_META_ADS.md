# Fase 2 — Núcleo Jarvis e Departamento Meta Ads

## Decisão executiva

A Sol.IA permanece como única porta de entrada e único núcleo canônico.

Nenhum dos repositórios existentes deve ser declarado vencedor absoluto ou copiado inteiro. O sistema final será montado com as melhores capacidades verificadas de cada fonte, preservando apenas uma interface, uma memória e uma governança.

## O que existe de verdade hoje

| Repositório | Evidência verificada | Decisão |
|---|---|---|
| `SOL-IA` | Núcleo canônico, captura de ideias, Supabase, skills e proteções. Ainda usa classificação local por regras. | Manter como produto principal. |
| `JARVIS-SOL` | Assistente tecnicamente mais completo: API, memória persistente, voz, anexos, OpenRouter, PWA e testes. | Migrar infraestrutura de memória e comunicação. |
| `Tronco-ia` | Melhor conceito de coordenador modular; implementação mais madura está concentrada no Publisher. | Migrar padrão de orquestração e pipeline editorial, não o app inteiro. |
| `Narrativas-Chronoscribe` | Fábrica de conteúdo mais aprofundada: livro, ebook, carrossel, VSL e mentoria. | Extrair domínio e pipelines após estabilizar dependências. |
| `adscript-ai` | Aplicação real de geração de roteiro com pré-avaliador determinístico. | Migrar geração e revisão, removendo promessas de aprovação automática. |
| `sol-lima-neuromarketing-agent` | Prompt e base de conhecimento Magnetus; não é sistema autônomo e não lê campanhas reais. | Migrar conhecimento após revisão factual e ética. |
| `Sistema-de-Gest-o-de-Campanhas-de-Marketing-Digital-Avan-ado` | Documento de requisitos; não contém gestor de campanhas implementado. | Usar como backlog do departamento Meta Ads. |

## Como Jarvis passa a decidir

O arquivo `src/core/capabilityRouter.ts` reconhece a intenção da entrada e encaminha para um especialista:

- livro, ebook ou manuscrito → Publisher Editorial;
- conteúdo, carrossel ou story → Chronoscribe Conteúdo;
- VSL ou carta de vendas → Chronoscribe + Publisher + Meta Ads;
- mentoria ou anamnese → Mentor Posicionamento;
- vídeo, reels, edição ou legenda → Motion/Vídeo;
- campanha, anúncio, pixel, ROAS ou Andromeda → Meta Ads;
- memória ou decisão anterior → Vault;
- risco jurídico → Lex Vanguard;
- impulso, madrugada ou desorganização → Guardião Diário;
- pedido ambíguo → Jarvis Executivo.

Esse roteador ainda não executa todos os módulos. Ele cria a primeira camada confiável: entender o pedido e escolher o departamento certo sem exigir que Sol escreva um prompt perfeito.

## Departamento Meta Ads

A primeira versão do exército terá oito especialistas:

1. Pesquisador de Oferta — entende produto, público, promessa e evidências.
2. Estrategista Criativo — cria hipóteses e famílias de criativos realmente diferentes.
3. Copywriter — transforma hipóteses em hooks, roteiros, legendas e CTAs.
4. Revisor de Política — identifica risco de promessa, atributo pessoal, clickbait e inconsistência.
5. Planejador de Campanha — prepara objetivo, estrutura, orçamento e plano de teste.
6. Analista de Mensuração — lê CTR, CPM, CPC, CPA, conversão, ROAS e sinais de funil.
7. Otimizador — recomenda manter, iterar, reduzir, aumentar ou pausar.
8. Relator Executivo — traduz métricas em decisão clara para Sol.

O especialista 7 nunca altera campanha ou orçamento sozinho. Toda ação externa de mídia paga exige aprovação explícita, limite de orçamento e registro de auditoria.

## O que Andromeda é — e o que não é

Andromeda é o mecanismo interno de recuperação personalizada de anúncios da Meta. Ele ajuda a selecionar, entre muitos anúncios elegíveis, quais devem avançar para as próximas etapas de recomendação.

Não existe uma API para um anunciante controlar, inspecionar ou “hackear” Andromeda. Portanto, nenhum agente da Sol.IA pode prometer dominar o algoritmo.

A integração legítima acontece por meios suportados:

- Meta Marketing API para campanhas, conjuntos, anúncios e métricas;
- dados de conversão corretos e deduplicados;
- diversidade real de conceitos criativos, não apenas pequenas trocas de cor;
- mensuração consistente;
- experimentos controlados;
- uso criterioso das automações Advantage+ quando forem adequadas.

Referências oficiais:

- [Meta Andromeda](https://engineering.fb.com/2024/12/02/production-engineering/meta-andromeda-advantage-automation-next-gen-personalized-ads-retrieval-engine/)
- [Meta Marketing API](https://developers.facebook.com/documentation/ads-commerce/marketing-api)
- [Ads Insights API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights)
- [SDK oficial Node.js](https://github.com/facebook/facebook-nodejs-business-sdk)

## Repositórios externos avaliados

- [facebook/facebook-nodejs-business-sdk](https://github.com/facebook/facebook-nodejs-business-sdk): fonte oficial para a futura integração Meta.
- [openai/openai-agents-js](https://github.com/openai/openai-agents-js): candidato oficial em TypeScript para coordenação supervisionada de agentes.
- [itallstartedwithaidea/advertising-hub](https://github.com/itallstartedwithaidea/advertising-hub): referência útil de taxonomia de especialistas, mas não será copiado nem conectado sem auditoria de código e segurança.
- [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp): demonstra uma superfície operacional ampla, porém usa serviço e autenticação de terceiros. Não será conectado sem decisão específica sobre privacidade, custo e dependência externa.

## Ordem de migração

1. Roteador de intenção e registro de capacidades.
2. Memória e anexos do `JARVIS-SOL`.
3. Publisher e Narrativas para livro, texto, VSL e mentoria.
4. Motion/Vídeo com processamento real.
5. Meta Ads em modo somente leitura: ingestão de métricas e relatórios.
6. Planejamento de campanhas em rascunho.
7. Escritas na conta Meta somente com aprovação humana explícita.
8. Validação de cada migração antes de arquivar qualquer fonte.

## Regras invioláveis

- uma única Sol.IA;
- nenhum repositório novo sem registro;
- nenhuma exclusão antes de migração e validação;
- nenhuma promessa de aprovação automática de anúncio;
- nenhum ROAS garantido;
- nenhuma mudança de orçamento, campanha ou anúncio sem aprovação;
- nenhuma credencial em código ou documentação;
- recomendação e execução são etapas separadas;
- todo módulo deve informar suas fontes e seu nível de confiança.
