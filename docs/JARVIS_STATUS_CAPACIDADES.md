# Jarvis / Sol.IA — Status de capacidades

> **Fonte operacional de verdade sobre maturidade.** Atualizado em 15/09/2026.

Este documento existe para impedir duas falhas comuns: apresentar requisito como se já fosse capacidade pronta ou esquecer recursos que já foram implementados.

## Legenda

- **OPERACIONAL** — implementado e verificado no ambiente compatível.
- **PARCIAL** — funciona em parte, mas a experiência completa ainda não está comprovada.
- **IMPLEMENTADO / AGUARDA PROVA FÍSICA** — código existe; falta dispositivo/plataforma real.
- **PLANEJADO** — requisito aceito e arquitetado, ainda não entregue.
- **BLOQUEADO/DEPENDENTE DE TERCEIRO** — depende de API, permissão, credencial, revisão ou limitação externa.

## 1. Núcleo, memória e continuidade

| Capacidade | Status | Evidência/limite |
|---|---|---|
| Autenticação web por Supabase | OPERACIONAL | Fluxo por código de e-mail, sessão e RLS existentes |
| Cofre privado `solia_memories` | OPERACIONAL | Registros privados e auditoria existentes |
| Continuidade durável | OPERACIONAL | Eventos persistentes, busca e recuperação por usuário |
| Anti-fadiga raiz/galhos/delta | OPERACIONAL no núcleo | Contratos e integração existem; qualidade semântica continua evolutiva |
| Perfil DNA versionado | OPERACIONAL como infraestrutura | Cadeia de supersessão existe; quantidade de claims reais depende do uso |
| Separação resposta da IA x memória da usuária | OPERACIONAL | Histórico de assistente em tabela própria |
| Jarvis Core v1 read-only | OPERACIONAL | Endpoint privado recupera continuidade, perfil, histórico e conhecimento sem escrita/modelo |
| Loops/pendências como sistema formal completo | PARCIAL | Sinais raiz/galho existem; gestão completa de loops abertos ainda evolui |

## 2. Conhecimento e fontes

| Capacidade | Status | Evidência/limite |
|---|---|---|
| Biblioteca privada versionada | OPERACIONAL | Documentos + chunks + origem/versão |
| Busca textual sem modelo | OPERACIONAL | FTS e retorno com proveniência |
| Importação GitHub/trilogia | OPERACIONAL em leitura | Fontes canônicas sincronizadas/importadas; não representa leitura irrestrita de qualquer repo |
| PDF/DOCX direto pelo chat | PLANEJADO | Chat atual aceita imagens e formatos textuais leves |
| Google Drive multi-conta nativo | PARCIAL/BLOQUEADO | Infraestrutura OAuth/vault existe; credenciais/contas ainda precisam ser conectadas no Jarvis |
| Originais em storage privado com extração | PLANEJADO | Arquitetura prevista |

## 3. Conversa e modelos

| Capacidade | Status | Evidência/limite |
|---|---|---|
| Chat web autenticado | PARCIAL | Backend e UI existem; usuário relatou falha de conversa antes de ajuste de autorização; precisa nova prova real após correção |
| Roteamento de especialistas | OPERACIONAL no backend | Roteamento interno existe; não exige escolha manual de agente |
| Política fail-closed de custo zero | OPERACIONAL | Modelo gratuito só é aceito se catálogo confirmar input/output a zero |
| Gateway via Vercel OIDC | OPERACIONAL como credencial de runtime | Não significa uso ilimitado nem garante disponibilidade de modelo |
| OpenAI/fornecedor premium como cérebro principal | PLANEJADO/OPCIONAL | Deve entrar como motor substituível, com custo/autorização claros |
| Modelo local Apple no iPhone | IMPLEMENTADO / AGUARDA PROVA FÍSICA | `FoundationModels` integrado no shell nativo; requer aparelho/OS compatível |
| Model router multiforncedor completo | PARCIAL | Estratégia existe; orquestração dinâmica completa ainda não |

## 4. Voz

| Capacidade | Status | Evidência/limite |
|---|---|---|
| TTS web do Jarvis | OPERACIONAL | Perfil Veludo seleciona melhor voz pt-BR disponível no aparelho |
| Reconhecimento de voz web | OPERACIONAL em primeiro plano | Depende do navegador; exige armar microfone manualmente |
| Wake phrase web “Jarvis, tá aí?” | PARCIAL | Funciona apenas com sessão de escuta já autorizada/ativa |
| Resposta falada “Tô aqui. Pode falar.” | IMPLEMENTADA | Código e testes; ainda precisa reteste físico no fluxo web atualizado |
| Conversa contínua web | PARCIAL | Sessão engajada existe; limitações do navegador/iOS permanecem |
| Cliente nativo iOS hands-free | IMPLEMENTADO / AGUARDA PROVA FÍSICA | App Intent, áudio, Speech, Keychain, contexto e cérebro local estão no branch |
| Atalho Vocal “Jarvis, tá aí?” sem toque | IMPLEMENTADO como integração prevista / AGUARDA PROVA FÍSICA | Requer instalar app e configurar uma vez em Acessibilidade > Atalhos Vocais |
| Uso com tela bloqueada | NÃO COMPROVADO | Deve ser testado separadamente no iPhone real |
| Identificação de locutor | PLANEJADO | Voz não será autenticação única |
| Voz neural/realtime natural nível ChatGPT | PLANEJADO | TTS local é etapa intermediária |
| Clone da voz da usuária para conteúdo | EXPERIMENTO REPROVADO | Primeiro ensaio real foi reprovado pela dona da voz; não usar como voz do Jarvis |

## 5. Câmera, vídeo e ambiente

| Capacidade | Status | Evidência/limite |
|---|---|---|
| Câmera web visível | OPERACIONAL | Preview local no app |
| Captura/análise de quadro sob comando | PARCIAL | Fluxo existe; depende de cérebro de resposta disponível |
| Troca frontal/traseira | OPERACIONAL no código web | |
| Modo ambiente temporário | OPERACIONAL no web | Buffer local; não salva terceiros automaticamente |
| Visão contínua em streaming | PLANEJADO | Não confundir com captura de quadro |
| Videochamada multimodal contínua | PLANEJADO | Cliente atual não equivale ao modo Live/Voice completo do ChatGPT |

## 6. Live e orientação em tempo real

| Capacidade | Status | Evidência/limite |
|---|---|---|
| Requisito “live no mesmo iPhone” | OFICIAL / PLANEJADO | Registrado no programa de construção |
| Orientação privada no ouvido | PLANEJADO | Deve usar rota de áudio isolada da live |
| Jarvis participante público | PLANEJADO | Exige mixagem pública autorizada |
| Alternância privado/público por comando | PLANEJADO | Ex.: “Jarvis, comigo” / “Jarvis, entra” |
| Leitura de chat YouTube | TECNICAMENTE VIÁVEL / NÃO INTEGRADA | API oficial suporta stream de chat; conector ainda não implementado no Jarvis |
| Instagram Live chat | DEPENDENTE DE API/PLATAFORMA | Necessita prova das permissões atuais |
| TikTok Live chat | DEPENDENTE DE API/PLATAFORMA | Necessita prova das permissões atuais |
| Análise de perguntas/agrupamento em tempo real | PLANEJADO | Depende do feed de chat e pipeline de baixa latência |
| War Room / estrategista ao vivo | PLANEJADO | Requisito aceito; ainda não certificado em live real |

## 7. Integrações e operação externa

| Capacidade | Status | Evidência/limite |
|---|---|---|
| GitHub como fonte de conhecimento | OPERACIONAL em leitura | Escrita autônoma pelo próprio Jarvis ainda não liberada |
| GitHub para desenvolvimento via ChatGPT conectado | OPERACIONAL fora do Jarvis | Não confundir conexão do ChatGPT com conector do app Jarvis |
| Vercel hospedando o web app | OPERACIONAL | |
| Vercel como ferramenta autônoma do Jarvis | PLANEJADO | |
| Supabase memória/auth | OPERACIONAL | |
| n8n | PLANEJADO | Executor externo ainda não conectado |
| WhatsApp Business | PLANEJADO | Deve usar via oficial/autorizada |
| Instagram/Facebook/TikTok/YouTube | PLANEJADO/PARCIAL | Arquitetura e inteligência social existem; contas não estão todas conectadas ao Jarvis |
| Google Drive | PARCIAL | Infraestrutura de conexão existe; uso nativo multi-conta não concluído |

## 8. Inteligência crescente e autoengenharia

| Capacidade | Status | Evidência/limite |
|---|---|---|
| Capability Radar | OPERACIONAL em escopo inicial | 8 fontes oficiais configuradas: OpenAI, Meta, TikTok, Vercel e Supabase |
| Frontier Radar global | PLANEJADO | Ainda não cobre todo ecossistema mundial de IA |
| Testes de regressão | OPERACIONAL | Vercel prebuild executa todos os contratos Node antes da Preview |
| Gate de Preview | OPERACIONAL | Preview não deve ficar READY se contratos Node falharem |
| Autodiagnóstico web/runtime | PARCIAL | Health checks e diagnósticos existem |
| Autodiagnóstico nativo iPhone | IMPLEMENTADO / AGUARDA PROVA FÍSICA | Tela prevista no shell nativo |
| Autorreparo completo | PLANEJADO | Detectar → reproduzir → patch → branch → testes → preview → aprovação → rollback |
| Alteração automática de produção | PROIBIDA POR PADRÃO | Não é objetivo do self-healing |

## 9. Segurança

| Capacidade | Status | Observação |
|---|---|---|
| RLS owner-only | OPERACIONAL | Dados pessoais isolados por `auth.uid()` |
| Segredos fora do frontend | OPERACIONAL como regra e testes | |
| Sessão nativa no Keychain | IMPLEMENTADO / AGUARDA PROVA FÍSICA | |
| Separação modo público/privado | OPERACIONAL no contrato | |
| Voz como autenticação única | NÃO PERMITIDO | Pode ser apenas sinal adicional |
| Passkey/Face ID para ações sensíveis | PLANEJADO | |
| Ações irreversíveis sem aprovação | NÃO LIBERADAS | |
| Multiusuário comercial isolado | PLANEJADO | |

## 10. Estado de testes em 15/09/2026

No checkpoint mais recente antes desta documentação, a Preview da Vercel ficou READY com **189/189 contratos Node passando** no `prebuild`, incluindo contratos de:

- Jarvis Core;
- privacidade;
- continuidade;
- anti-fadiga;
- voz web;
- shell nativo;
- autenticação/Keychain;
- contexto read-only;
- Foundation Models;
- diagnóstico;
- handoff Mac.

Isso não substitui testes que exigem hardware Apple, plataforma de live ou conta externa real.

## 11. Próxima sequência oficial

1. Compilar o cliente nativo no Mac com Xcode.
2. Instalar no iPhone.
3. Confirmar login, diagnósticos e cérebro local.
4. Configurar “Jarvis, tá aí?” nos Atalhos Vocais.
5. Provar mãos-livres.
6. Testar separadamente tela bloqueada.
7. Evoluir TTS para voz realtime natural.
8. Construir/provar modo Live: orientação privada + participação pública + chats de plataformas.
9. Expandir conectores e execução autorizada.
10. Evoluir self-healing e arquitetura multiusuário.

**Regra:** uma capacidade só muda de status quando a evidência correspondente existe.
