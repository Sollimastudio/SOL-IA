# Integracoes somente leitura

## Publisher, Narrativas e Video

Nesta etapa, o SOL-IA incorpora um catalogo curado de capacidades e
repositorios-fonte. O Jarvis pode usar esse repertorio para planejar, comparar,
roteirizar e criar rascunhos dentro do nucleo. Ele nao altera os repositorios
originais nem publica artefatos externamente.

## Meta Ads

O endpoint `GET /api/meta-ads-insights` tem uma unica finalidade: ler metricas
da Insights API.

Protecoes implementadas:

- exige uma sessao Supabase valida;
- usa token Meta apenas no servidor;
- aceita somente `GET`;
- limita periodo e nivel a listas fechadas;
- usa uma lista fixa de metricas;
- nao devolve o objeto `paging`, que pode conter credenciais em URLs;
- nao possui codigo para criar, editar, pausar ou excluir campanhas;
- nunca altera publico, lance ou orcamento.

Variaveis exclusivas do servidor:

- `META_ACCESS_TOKEN`: token com o menor escopo necessario, normalmente
  `ads_read`;
- `META_AD_ACCOUNT_ID`: identificador numerico da conta;
- `META_GRAPH_API_VERSION`: versao explicita suportada no momento da ativacao.
- `META_ALLOWED_USER_IDS`: UUID do usuario Supabase autorizado. Para mais de
  um usuario, use uma lista separada por virgulas.

Nenhuma variavel Meta pode usar o prefixo `VITE_`.

## Andromeda

Andromeda e um sistema interno da Meta para recuperacao personalizada de
anuncios. Nao existe uma API de anunciante para controla-lo. A integracao
legitima e a Meta Marketing API, com dados de conversao corretos, diversidade
criativa, medicao e experimentos controlados.
