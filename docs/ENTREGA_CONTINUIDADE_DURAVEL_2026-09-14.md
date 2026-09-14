# Entrega verificável — Continuidade Durável do Jarvis — 14/09/2026

## Problema corrigido
O anti-fadiga anterior analisava principalmente a conversa aberta e podia perder continuidade ao longo do tempo. Isso favorecia respostas que reexplicavam o projeto como se fosse novidade.

## O que entrou
- `solia_memories` continua sendo o cofre bruto: preserva o que a usuária realmente disse.
- `solia_continuity_events` é o Diário de Continuidade: relaciona cada fala salva ao histórico.
- Classificações heurísticas iniciais: `repeat`, `detail`, `correction`, `decision`, `branch`, `new_topic`.
- Escopos separados: `raw_statement`, `temporary_state`, `exploration`, `explicit_update`.
- Estado momentâneo não pode substituir identidade/posicionamento. Hipótese/exploração não vira opinião consolidada.
- Correções e decisões explícitas entram como âncoras recuperáveis mesmo quando não compartilham todas as palavras do pedido atual.
- Antes de responder em modo privado, o chat consulta o Diário e recebe uma diretiva de responder ao delta, sem reencenar descoberta.
- Frases como “agora entendi” só devem aparecer quando houver correção real de entendimento, não como abertura retórica.
- O Diário é indexado somente depois de a escrita original no cofre ser confirmada. Falha no diário não transforma gravação incerta em sucesso.
- Captura sem IA também indexa o Diário quando o cofre confirma o salvamento.
- Modo público não consulta o Diário privado.

## Segurança
A tabela do Diário não é legível diretamente por `anon` nem `authenticated`. Leitura e gravação passam por RPCs que usam `auth.uid()` e limitam o proprietário. O conteúdo recuperado é tratado como dado não confiável no prompt, nunca como instrução.

Supabase Advisors ainda mostram avisos em tabelas/funções antigas. Não considerar o projeto inteiro livre de pendências de segurança por causa desta entrega.

## Prova em produção do banco
- Migração `continuity_journal`: aplicada com sucesso no Supabase `ACESSORA-SOL.IA`.
- Migração `continuity_api_lockdown`: aplicada com sucesso.
- Migração `continuity_anchor_retrieval`: aplicada com sucesso.
- As 4 memórias já existentes foram associadas ao Diário sem alterar o texto original.
- Consulta sob papel `authenticated` recuperou 4 registros do Diário usando a conta piloto.
- `has_table_privilege(..., 'SELECT')` retornou `false` para acesso direto à tabela sob `authenticated`.

## Provas automatizadas
- Testes unitários cobrem repetição, correção explícita, estado temporário, exploração, modo público sem consulta, truncamento de dados recuperados, persistência somente após memória confirmada e ausência de evento quando o cofre falha.
- Workflow de biblioteca/banco aplica migrações em PostgreSQL descartável e verifica RPC, isolamento entre contas e bloqueio de acesso direto.
- Build e contratos do chat devem permanecer verdes no HEAD correspondente antes de declarar a Preview utilizável.

## O que esta entrega NÃO resolve
- Não transforma heurística lexical em compreensão semântica perfeita.
- Não cria Perfil DNA consolidado automaticamente.
- Não garante que toda resposta futura nunca repita algo; reduz estruturalmente o problema e deixa evidências para medir/fixar regressões.
- Não ativa wake word em background, identificação biométrica de voz, videochamada inteligente, automações externas ou engenheiro autônomo.
- Não guarda respostas do assistente como fatos sobre a usuária. Isso é deliberado para evitar que uma invenção da IA vire memória autorreferente.

## Próximo salto recomendado
Criar o `Perfil DNA versionado` sobre o Diário, com afirmações rastreáveis à fonte e estados separados: eixo estável, preferência, objetivo, limite, exploração e estado temporário. Consolidação deve ser corrigível e nunca apagar a fala original. Depois, conectar tarefas/decisões/loops abertos ao mesmo grafo de continuidade.
