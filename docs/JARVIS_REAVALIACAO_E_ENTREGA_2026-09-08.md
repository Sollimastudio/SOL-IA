# Jarvis / Sol.IA — reavaliação e primeiro incremento

## Decisão

Continuar no repositório privado `Sollimastudio/SOL-IA`. Recuperar a experiência do **Sol.IA — Sistema Neural**, sem substituir a segurança atual por serviços legados inseguros. Não criar outro repositório, não apagar fontes e não confundir o Ativador de Renda com o assessor inteiro.

A descrição da interface antiga corresponde fortemente aos arquivos recuperados da Library em 08/09/2026:
- `remix_-sol.ia---sistema-neural.zip` (original);
- `solia_sistema_neural_OFICIAL_eu_nao_desapareco.zip` (versão trabalhada).

O código mostra três cartões: **Assessor Pessoal**, **Neuro-Visceral Studio** e **Criador de Conteúdo**; visual escuro com destaques roxo, âmbar e azul. Há módulos de câmera, reconhecimento de fala, resposta falada, geração, conhecimento e chamadas REST ao Supabase. Isso comprova implementação de chamadas, não conexão ativa em produção. Não foi realizada confirmação visual no iPhone.

## Comparação dirigida

| Fonte | Valor reaproveitável | Limite observado | Decisão |
|---|---|---|---|
| Sistema Neural recuperado | Experiência mais próxima: assessor, voz, câmera, conteúdo e vídeo | `vite.config.ts` injeta chave Gemini no bundle; serviços antigos usam chave compartilhada em `sol_memory`; reconhecimento contínuo transcreve antes de filtrar ativação; callback usa estado inicial | Recuperar experiência e componentes após migração segura; não publicar o ZIP |
| `JARVIS-SOL` | Chat servidor/OpenRouter, API, persistência e interface HUD/PWA | Caminho `processChatMessage` usa últimas 20 mensagens sem recuperar o cofre; rotas lidas não verificam identidade | Reaproveitar padrões de transporte/voz, não copiar a segurança antiga |
| `SOL-IA` main `9ae1b3f...` | Auth, cofre isolado, RLS, roteador e governança oficial | `App.tsx` devolve relatório local de roteamento, não resposta gerada por IA | Base canônica deste incremento |
| `Jarvis-Sol.IA` | Interface React/Radix, chat e organização cognitiva | `package.json` usa MySQL/Drizzle e runtime Manus; não corresponde diretamente à base Supabase procurada | Fonte secundária; não migrar a aplicação inteira |
| `Tronco-ia` | Conceito modular e Publisher | README ainda lista conexão de IA, persistência e upload como próximos passos; escopo predominantemente editorial | Departamento especializado, não substituto do assessor |
| `app.Sol.ia` | Ativador de Renda já analisado na conversa | Não é a porta única; esta rodada não repetiu sua auditoria inteira | Manter como departamento comercial |

## Código entregue nesta branch

- `api/jarvis-chat.ts` + `server/jarvis-chat.mjs`: conversa com modelo via servidor, utilizando o roteador existente.
- Autenticação confirmada no Supabase Auth e lista explícita de contas do piloto.
- Recuperação lexical de até seis registros entre as últimas 50 memórias próprias. Não é ainda busca semântica de todos os livros.
- Gravação opcional de fala bruta; respostas da IA não viram fatos canônicos.
- Modo público sem leitura/escrita do cofre privado. Histórico reiniciado ao trocar modo, conta ou conversa; painéis privados removidos do modo público.
- Cota atômica no banco: máximo de 40 tentativas de geração por usuário/dia UTC, além do limite de saída por resposta. Isso não substitui orçamento financeiro no provedor.
- Interface conversacional substitui o relatório de classificação como entrada principal; cofre, autenticação e painel Meta Ads permanecem disponíveis no modo privado.
- Voz de primeiro plano mediante consentimento. Comando explícito de encerramento, parada ao ocultar página e expiração após dois minutos sem interação.
- Nenhum autoarranque de microfone, nenhum detector de ativação falso, nenhuma gravação contínua do ambiente prometida como local.
- 24 testes automatizados de contrato, privacidade e sessão, sem credenciais reais ou chamadas a modelos pagos.

Os especialistas nesta etapa são perfis de resposta selecionados pelo roteador, não agentes autônomos com execução externa. O transporte é texto/HTTP com fala do navegador, não uma sessão audiovisual em tempo real.

## Ativação — trabalho de engenharia, não tarefa devolvida à Sol

A branch permanece desligada no servidor por padrão. Antes de disponibilizar o piloto:
1. Revisar o diff e compilar o app completo.
2. Em ambiente de teste, confirmar a migração existente `202607240200_install_solia_vault.sql` e aplicar a migração aditiva de cota desta branch.
3. Configurar Auth/Magic Link e `VITE_SECURE_MEMORY_ENABLED` somente após testar isolamento.
4. Configurar no servidor `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENROUTER_API_KEY`, `JARVIS_MODEL` e `JARVIS_ALLOWED_USER_IDS`. A chave de modelo nunca recebe prefixo `VITE_`. Nenhuma chave real foi copiada dos ZIPs.
5. Aplicar limite financeiro à chave no provedor e confirmar o modelo autorizado. Só então habilitar `JARVIS_CHAT_ENABLED=true` no ambiente de teste.
6. Executar testes reais de login, memória, geração, encerramento e troca de conta/modo. Testar SQL concorrente e RLS com dois usuários; mocks não provam políticas implantadas.
7. Validar no iPhone antes de promover a produção. Nenhum deploy de produção ou migração foi executado nesta entrega.

Para desenvolvimento integrado, `/api` precisa do runtime de funções (por exemplo, Vercel dev); `vite dev` isolado não inicia a função de servidor. Não declarar um teste apenas da tela como teste da jornada.

## Requisitos preservados — NÃO estão concluídos

- Ativação local por “Jarvis”, da cama e com tela bloqueada; avaliar dispositivo sempre disponível/app nativo. A API de fala do navegador não atende esse requisito sozinha.
- Verificação de locutor, adaptação à fala da usuária e interrupção natural de resposta.
- Transporte de voz em tempo real, chamada de vídeo e visão consentida.
- Coapresentação em live, inclusive prova de captura de áudio no cenário real de um telefone; proteger memória privada e evitar eco.
- Agentes jurídico, autorreflexão, tráfego, copy, conteúdo, editorial e audiovisual com ferramentas, contratos e revisão; sem falsas credenciais clínicas/jurídicas.
- Tarefas duráveis, agenda de monitoramento autorizado 24h, recuperação de falhas e notificações.
- Catálogo e ingestão versionada de Morte em Vida, Reposicione-se, Fuga Identitária, Feminicídio Emocional e Eu Não Desapareço, sem misturar fatos, método e sugestões.
- Clone audiovisual autorizado e biblioteca de identidade pública distinta da memória íntima.
- Venda multiusuário: cobrança, segregação validada, consentimentos, custos e suporte.

## Limites da verificação desta entrega

Os testes de runtime usam respostas simuladas de Auth, banco e provedor, e os testes de voz verificam a máquina de estados sem áudio real. Não certificam login em produção, qualidade de respostas, SQL aplicado, telefone bloqueado, reconhecimento biométrico, vídeo ou live. O ambiente local não resolveu o domínio GitHub para clone/instalação. A leitura e gravação de código foram feitas pelo conector; nenhum segredo foi solicitado à usuária.

## Fontes técnicas

- https://github.com/Sollimastudio/SOL-IA/blob/9ae1b3f69986cf27ec4faf4df59aaedc18baad0a/src/App.tsx
- https://github.com/Sollimastudio/SOL-IA/blob/main/docs/GOVERNANCA_REPOSITORIOS.md
- https://github.com/Sollimastudio/JARVIS-SOL/blob/main/src/api.ts
- https://github.com/Sollimastudio/Jarvis-Sol.IA/blob/main/package.json
- https://github.com/Sollimastudio/Tronco-ia/blob/main/README.md
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- https://supabase.com/docs/reference/javascript/auth-getuser
- https://openrouter.ai/docs/api/api-reference/chat/create-a-chat-completion
- https://vercel.com/docs/functions/runtimes/node-js
