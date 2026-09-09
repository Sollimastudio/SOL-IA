# Jarvis / Sol.IA — continuidade verificável

## Ponto único de trabalho

Repositório: `Sollimastudio/SOL-IA`. Proposta ativa: PR #6, branch `work/jarvis-neural-conversa-segura-20260908`.
Esta etapa parte do commit `546806e9180ce620db2009be71e729bed937c577` e preserva a interface Neural. Não criar outro Jarvis. Não sobrescrever `main`, aplicar migrações reais ou habilitar custos automaticamente.
Antes da continuação, ler este registro, a PR e seu HEAD real; comparar alterações concorrentes.

## Objetivo que não pode ser perdido

Assessor pessoal por voz e vídeo, porta única para especialistas (apoio jurídico, autorreflexão, conteúdo/copy, tráfego, editorial, audiovisual, tecnologia e negócios). Captura da cama por palavra de ativação com privacidade; memória corrigível; acompanhamento de fontes autorizadas; live em modo público; identidade/clone autorizados; futura venda com dados isolados por cliente. Livros são parte do assessor, não substituem o produto.

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
Consultar checks do commit atual para confirmar o resultado de CI; criar teste não significa executá-lo. Não foi usado conteúdo real da Sol nos testes. Nenhum livro foi importado automaticamente. Não foi comprovado uso real em iPhone, geração com conta real, banco Supabase de produção, áudio ou câmera.

### Ativação controlada

A nova API fica desligada até `JARVIS_KNOWLEDGE_ENABLED=true` no servidor. Usa os mesmos dados de Auth e `JARVIS_ALLOWED_USER_IDS` do piloto, sem `service_role`. Aplicar a migração `202609090310_knowledge_sources.sql` somente em ambiente isolado primeiro. Quotas iniciais: 200 revisões/4 MiB de texto por conta. A biblioteca atual não oferece exclusão nem exportação integral; implementar política de retenção/exclusão/exportação antes de disponibilizar para clientes.
Se a biblioteca estiver desligada, o chat anterior não muda. Se ligada e indisponível, o chat emite aviso explícito de contexto incompleto em vez de inventar uma leitura. Não confundir login concluído com provedor ou cofre funcionando.

## Próxima entrega delimitada

1. Apresentar os trechos e versões de `knowledgeSources` na mensagem do chat e acrescentar testes de navegador para troca público/privado/conta.
2. Validar biblioteca + conversa com contas reais de TESTE e autenticação Supabase; não remover proteção para passar no teste.
3. Implementar importação DOCX/PDF com pré-visualização, extração rastreável e confirmação de versão; depois busca semântica se necessária.
4. Consolidar decisões e tarefas com estado durável e aprovadores. Agentes ainda são perfis de resposta, não operadores autônomos.

## Exigências grandes ainda abertas

Wake word local/tela bloqueada, identificação de voz, interrupção natural, conversa audiovisual, live no mesmo telefone, tarefas 24h, ferramentas executoras, revisão clínica/jurídica adequada, clone autorizado e cobrança multiusuário. Não declarar concluídas por existir interface ou um teste simulado.

## Referências técnicas usadas

- https://supabase.com/docs/guides/database/full-text-search
- https://www.postgresql.org/docs/current/sql-createfunction.html
