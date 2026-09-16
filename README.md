# Jarvis / Sol.IA

**Assistente pessoal e operacional com continuidade, memória privada, voz, visão, conhecimento e ferramentas coordenadas por uma única interface.**

> Projeto-mãe: **Eu Não Desapareço**  
> Repositório canônico: `Sollimastudio/SOL-IA`

## O que é

Jarvis é a porta única da Sol.IA. Ele foi criado para permitir que uma pessoa fale, pense, crie e administre múltiplos projetos sem precisar reconstruir contexto, escolher agentes, lembrar versões ou gerenciar a infraestrutura de IA por trás de cada tarefa.

A ideia central é simples:

> **A usuária fala com Jarvis. Jarvis administra a complexidade.**

Jarvis não é um modelo específico. Memória, continuidade, Perfil DNA, biblioteca, permissões e estado dos projetos pertencem ao sistema. Modelos locais ou externos são motores substituíveis.

## Por que existe

O projeto nasceu para resolver quatro problemas:

1. **fadiga de contexto** — não repetir a própria história e o estado dos projetos;
2. **pensamento ramificado** — preservar raiz, galhos, decisões e pendências sem limitar espontaneidade;
3. **empresa de uma pessoa só** — coordenar criação, tecnologia, conteúdo, pesquisa, operação e ferramentas como uma equipe invisível;
4. **independência tecnológica** — poder trocar modelos e provedores sem perder a memória e a identidade operacional do sistema.

## Como funciona

```text
USUÁRIA
   │
   ▼
JARVIS — conversa única
   │
   ▼
JARVIS CORE
contexto + continuidade + políticas
   │
   ├── Memória / Perfil DNA / Projetos
   ├── Biblioteca de conhecimento
   ├── Modelos locais e externos
   ├── Especialistas internos
   └── Ferramentas e conectores autorizados
```

O Jarvis deve recuperar somente o contexto necessário, distinguir hipótese de decisão, preservar correções, indicar a origem das fontes e nunca afirmar uma ação que não foi realmente executada.

## Capacidades principais

### Continuidade e anti-fadiga

- memória privada com autenticação;
- raiz/galhos/delta;
- decisões e correções versionadas;
- Perfil DNA corrigível;
- histórico do assistente separado de fatos pessoais;
- retomada de projeto sem começar do zero.

### Conhecimento

- biblioteca privada versionada;
- busca textual com proveniência;
- fontes de projetos/livros;
- integração GitHub em leitura para conhecimento selecionado.

### Voz e presença

- voz web em primeiro plano;
- frase escolhida: **“Jarvis, tá aí?”**;
- perfil de voz do assistente: **Veludo**;
- cliente nativo iOS em desenvolvimento para mãos-livres, App Intent, Keychain, áudio e cérebro local Apple;
- câmera e análise de quadro sob comando;
- evolução planejada para voz realtime e visão contínua.

### Live

A visão do produto inclui uso em live no mesmo iPhone:

- orientação privada no fone, como um estrategista/diretor;
- leitura e agrupamento de perguntas permitidas pelas plataformas;
- participação pública do Jarvis quando autorizada;
- separação rigorosa entre áudio privado e áudio da transmissão.

Essa camada é requisito oficial, mas ainda precisa ser construída e provada plataforma por plataforma.

### Evolução contínua

- Capability Radar com fontes oficiais;
- testes de regressão;
- Preview antes de promoção;
- self-healing supervisionado: detectar → reproduzir → patch → testar → Preview → aprovação → rollback.

## Estado atual

O projeto está em **beta de desenvolvimento**.

O núcleo de memória, continuidade, biblioteca, Core read-only, segurança por usuário e testes está implementado. A PWA/web app funciona como interface atual, mas não satisfaz sozinha a experiência mãos-livres desejada no iPhone.

O cliente nativo iOS já possui código para:

- App Intent;
- sessão `playAndRecord`;
- reconhecimento pt-BR;
- login por código;
- Keychain;
- contexto privado read-only;
- Apple Foundation Models quando disponível;
- resposta falada e retorno à escuta;
- autodiagnóstico;
- instalador guiado para Mac/Xcode.

**Ainda falta a prova física no Mac/iPhone antes de classificar essa experiência como operacional.**

Consulte a matriz detalhada em [`docs/JARVIS_STATUS_CAPACIDADES.md`](docs/JARVIS_STATUS_CAPACIDADES.md).

## Segurança

Princípios obrigatórios:

- Supabase Auth + RLS owner-only;
- nenhum `service_role` no frontend;
- segredos de IA e OAuth ficam no servidor/vault apropriado;
- sessão nativa no Keychain;
- modo público isolado do Cofre privado;
- voz não é autenticação única para ação sensível;
- fala de terceiros não vira memória automaticamente;
- publicação, gasto, exclusão e outras ações irreversíveis exigem política de autorização;
- falha de provedor não autoriza fallback pago silencioso.

## Modelos de IA

O Jarvis foi desenhado para não ficar preso a um único modelo.

Pode combinar:

- modelo local/on-device;
- modelo zero-cost verificado;
- modelos premium quando autorizados;
- motores especializados para voz, visão, código ou vídeo.

A assinatura pessoal do ChatGPT não é uma API embutida no Jarvis. ChatGPT/Codex podem ser usados como oficina de desenvolvimento, enquanto o produto usa suas próprias integrações autorizadas.

## Desenvolvimento

```bash
npm install
npm test
npm run build
```

A Preview da Vercel executa todos os contratos Node no `prebuild` antes de publicar.

Para o cliente nativo iOS, consulte:

- `ios/JarvisNative/README-INSTALAR.md`
- `ios/JarvisNative/PREPARAR-JARVIS.command`

## Documentação oficial

Comece por [`docs/JARVIS_INDICE_DOCUMENTACAO.md`](docs/JARVIS_INDICE_DOCUMENTACAO.md).

Documentos principais:

- [`docs/JARVIS_PRODUTO_E_VISAO.md`](docs/JARVIS_PRODUTO_E_VISAO.md) — propósito e visão;
- [`docs/JARVIS_MODO_DE_USO.md`](docs/JARVIS_MODO_DE_USO.md) — manual do usuário;
- [`docs/JARVIS_STATUS_CAPACIDADES.md`](docs/JARVIS_STATUS_CAPACIDADES.md) — o que está pronto e o que não está;
- [`docs/JARVIS_ARQUITETURA_GERAL.md`](docs/JARVIS_ARQUITETURA_GERAL.md) — arquitetura;
- [`docs/JARVIS_OPERACAO_E_MANUTENCAO.md`](docs/JARVIS_OPERACAO_E_MANUTENCAO.md) — runbook técnico;
- [`docs/CONTINUIDADE_JARVIS.md`](docs/CONTINUIDADE_JARVIS.md) — checkpoints e decisões de desenvolvimento.

## Regra de ouro

Toda nova capacidade deve reduzir trabalho mental ou operacional, preservar continuidade e manter estado verificável.

**Jarvis não deve virar mais um sistema para a usuária administrar. Ele deve ser o sistema que ajuda a administrar os outros.**
