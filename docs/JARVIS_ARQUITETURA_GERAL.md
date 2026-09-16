# Jarvis / Sol.IA — Arquitetura geral

> **Documento técnico canônico de alto nível.** Explica como as partes do Jarvis se relacionam sem depender de um modelo ou fornecedor específico.

## 1. Visão arquitetural

Jarvis é uma arquitetura em camadas. A interface conversa com a usuária; o núcleo recupera estado; o roteador escolhe capacidades; memória e fontes preservam continuidade; ferramentas executam ações autorizadas; modelos são motores substituíveis.

```text
USUÁRIA
  │
  ▼
INTERFACES
Web / iPhone nativo / Voz / Câmera / Live
  │
  ▼
JARVIS CORE
estado + contexto + anti-fadiga + políticas
  │
  ├──────────────► MEMORY / KNOWLEDGE
  │               Supabase + Perfil DNA + Continuidade + Biblioteca
  │
  ├──────────────► MODEL ROUTER
  │               local / zero-cost / premium / especialista
  │
  ├──────────────► TOOL ROUTER
  │               GitHub / Drive / Vercel / n8n / redes / web / arquivos
  │
  └──────────────► EXECUTION LAYER
                  ações autorizadas + auditoria + rollback
```

O produto não deve depender da memória de uma conversa de ChatGPT para funcionar. O estado operacional vive em infraestrutura própria.

## 2. Interfaces

### 2.1 Web/PWA

Responsabilidades:

- login;
- conversa por texto;
- voz em primeiro plano;
- anexos suportados;
- modos privado/performance;
- biblioteca/cofre/integrações;
- câmera e quadro sob comando.

Limite estrutural: navegador no iPhone não é a camada ideal para wake word permanente, áudio em background e roteamento avançado de live.

### 2.2 Cliente nativo iOS

Criado para capacidades que precisam do sistema operacional:

- App Intents;
- ativação por Atalhos Vocais;
- `AVAudioSession.playAndRecord`;
- Speech pt-BR;
- sessão protegida no Keychain;
- continuidade de áudio compatível com background quando permitido;
- Foundation Models on-device quando disponível;
- futuro roteamento de áudio privado/público;
- futuras notificações, widgets, Live Activities e integração mais profunda com iOS.

O cliente nativo não deve conter chaves privadas de modelo/provedor.

## 3. Jarvis Core

O `Jarvis Core` é a identidade operacional do sistema, não o modelo de linguagem.

Responsabilidades:

- validar sessão e autorização;
- montar contexto relevante;
- preservar raiz/galhos/decisões;
- recuperar memória e fontes;
- aplicar políticas de privacidade;
- informar warnings e ausência de fontes;
- manter interfaces independentes dos modelos.

O Core v1 atual é read-only: recupera contexto sem executar ação externa.

## 4. Anti-fadiga e estado conversacional

A arquitetura mantém diferença entre:

- assunto-raiz;
- galho atual;
- galhos abertos;
- delta;
- decisão vigente;
- correção;
- hipótese;
- tarefa;
- pendência;
- material importado.

Contexto deve ser montado em camadas:

1. interação atual;
2. estado do assunto;
3. memória relevante;
4. fontes rastreáveis;
5. histórico frio apenas quando necessário.

Isso reduz repetição, custo e perda de contexto.

## 5. Persistência e banco

Supabase/PostgreSQL é a base de autenticação e persistência do piloto.

Principais famílias de dados:

### Memória

`solia_memories`

Guarda fala/registro privado com origem e metadados.

### Auditoria de memória

`solia_memory_audit_logs`

Mantém trilha de criação/alteração/exclusão conforme regras do módulo.

### Continuidade

`solia_continuity_events`

Registra relação, escopo, tópico, delta e sinais.

### Perfil DNA

`solia_profile_claims`

Armazena objetivos, limites, preferências, estilo, decisões e correções. Suporta `active/superseded` e cadeia explícita de substituição.

### Histórico do assistente

`solia_assistant_history`

Respostas do Jarvis ficam separadas da memória pessoal para evitar que sugestão da IA vire automaticamente verdade sobre a usuária.

### Conhecimento

`solia_knowledge_documents` e `solia_knowledge_chunks`

Biblioteca versionada, com pesquisa textual e proveniência.

### Conexões

`solia_source_connections`, `solia_source_credentials`, `solia_oauth_states`

Representam integrações e estados de OAuth/credenciais, mantendo segredos fora do frontend.

## 6. Segurança de dados

Princípios obrigatórios:

- Auth antes de acesso privado;
- `owner_id` em dados pessoais;
- RLS com isolamento por usuário;
- sem `service_role` no navegador/iPhone;
- chaves privadas apenas em servidor/vault apropriado;
- modo público sem Cofre;
- fala de terceiros sem persistência automática;
- respostas do modelo separadas de fatos pessoais;
- ações sensíveis com aprovação/política explícita.

O futuro multiusuário deve preservar as mesmas garantias por cliente.

## 7. Estratégia de modelos

Jarvis não é sinônimo de um modelo específico.

Camadas previstas:

### Local/on-device

Para tarefas privadas, rápidas e de baixo custo quando o aparelho suporta. No iOS atual existe integração em código com Apple Foundation Models, ainda pendente de prova física.

### Zero-cost verificado

O backend pode usar um modelo dedicado do AI Gateway somente se o catálogo confirmar preço de entrada e saída exatamente zero. Se a condição não for verdadeira, falha fechada: não escolhe fallback pago silencioso.

### Premium

Modelos OpenAI ou de outros fornecedores podem ser usados para tarefas que exigem maior capacidade, com configuração de servidor, medição e autorização de custo.

### Especialistas

Voz realtime, visão, código, vídeo e outras tarefas podem ter motores especializados.

## 8. Model Router

O roteador completo deve escolher motor por:

- capacidade necessária;
- privacidade;
- custo;
- latência;
- disponibilidade;
- tamanho do contexto;
- qualidade comprovada em benchmark próprio;
- restrições de plataforma.

Trocar um modelo não deve apagar memória, identidade ou ferramentas.

## 9. Tool Router e conectores

Ferramentas previstas/atuais incluem:

- GitHub;
- Google Drive;
- Vercel;
- Supabase;
- n8n;
- WhatsApp Business;
- Instagram;
- Facebook;
- TikTok;
- YouTube;
- web/pesquisa;
- arquivos.

Arquitetura recomendada:

1. leitura primeiro;
2. escopos mínimos;
3. proveniência;
4. escrita somente depois;
5. ações irreversíveis com confirmação apropriada;
6. comprovante de execução.

Conexão existente no ChatGPT não é automaticamente conexão do Jarvis. Cada conector do produto precisa de autorização própria.

## 10. Capability Radar

O radar acompanha mudanças oficiais relevantes e não altera produção sozinho.

Fluxo:

```text
fonte oficial
→ detectar mudança
→ classificar impacto
→ registrar oportunidade/risco
→ protótipo em branch/sandbox
→ benchmark/testes
→ PR
→ promoção por gates
```

O escopo atual possui oito fontes iniciais. A expansão global deve incluir outros laboratórios, SDKs, sistemas operacionais, open source, voz, multimodalidade e infraestrutura sem transformar rumor em fato.

## 11. Self-healing supervisionado

Autocorreção significa:

1. observar erro;
2. reproduzir;
3. formular hipótese;
4. criar patch isolado;
5. testar;
6. gerar Preview;
7. comparar com baseline;
8. promover após gates;
9. manter rollback.

Não significa editar produção sem controle.

## 12. Voz e conversa realtime

Arquitetura desejada:

```text
wake / App Intent
→ sessão de áudio
→ detecção de fala
→ contexto Jarvis
→ motor de raciocínio
→ resposta de voz
→ barge-in/interrupção
→ continuar sessão
```

A frase de ativação escolhida é **“Jarvis, tá aí?”**.

A voz do Jarvis deve ser própria do assistente. A voz pessoal da usuária é uma capacidade separada para conteúdo e exige autorização explícita.

## 13. Câmera e multimodalidade

Fases:

1. captura de imagem/quadro sob comando;
2. interpretação multimodal com contexto;
3. streaming contínuo autorizado;
4. chamada de vídeo com interrupção natural;
5. live com visão, áudio e chat.

O sistema deve deixar câmera/microfone visíveis e desligáveis.

## 14. Arquitetura de Live

O objetivo final é operar no mesmo iPhone quando a plataforma permitir.

```text
                 ┌──────────────► LIVE / PÚBLICO
VOZ DA USUÁRIA ──┤
                 │
JARVIS PÚBLICO ──┘

CHAT / ÁUDIO / CONTEXTO ──► JARVIS LIVE ENGINE
                                  │
                                  ├──► análise / fact-check / agrupamento
                                  │
                                  └──► AIRPODS / PRIVADO
```

Requisitos:

- áudio privado nunca vaza para transmissão;
- áudio público só entra mediante modo/autorização;
- troca de canal cancela resposta incompatível;
- comentários do público são dados, não comandos privilegiados;
- cada plataforma precisa de prova de API e mixagem;
- atraso, eco, reconexão e interrupção precisam ser medidos.

## 15. Inteligência social

Fluxo de aprendizagem desejado:

```text
hipótese de conteúdo
→ publicação autorizada
→ métricas
→ resultado comercial
→ comparação com baseline
→ aprendizado com confiança
→ próxima hipótese
```

O sistema deve trabalhar com dados agregados e permissões oficiais. Não inferir características sensíveis de indivíduos para segmentação.

## 16. Pipeline de entrega

A disciplina de desenvolvimento é:

```text
requisito observado
→ delta
→ branch/PR
→ testes
→ Preview
→ prova física quando necessária
→ documentação de status
→ promoção
```

A Vercel executa atualmente todos os contratos Node no `prebuild` antes de publicar Preview.

## 17. Regra de arquitetura

Toda nova capacidade deve responder a quatro perguntas:

1. reduz carga mental/operacional da usuária?
2. preserva memória e proveniência?
3. pode ser trocada sem reconstruir o produto inteiro?
4. tem estado real verificável em vez de promessa?

Se não, a capacidade ainda não está pronta para entrar no núcleo.
