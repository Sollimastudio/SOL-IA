# Orçamento zero, voz própria e proteção de acesso

Atualização: 13/09/2026. Esta decisão complementa o programa de construção e prevalece sobre propostas anteriores de ativação de serviços pagos.

## Regra financeira e efeito na experiência

Sol informou que hoje não pode pagar nada e quer sua própria máquina. Nenhuma nova assinatura, API paga, GPU, recarga ou aumento de quota está autorizado. Créditos promocionais não são prova de operação permanentemente gratuita.

O chat atual usa inferência remota; não foi possível certificar uma franquia gratuita de geração para a conta. Esta entrega pausa geração com consumo por padrão e mantém uma operação útil: guardar e consultar ideias no cofre existente, sem chamar modelo de IA.

O efeito é deliberado e precisa ser explicado com clareza: o modo de orçamento zero não produz respostas inteligentes novas. A tela mostra que a geração está pausada. Não vender um recibo de gravação ou regra determinística como IA generativa.

Custos de infraestrutura já contratada continuam sujeitos aos planos e limites existentes. “Nenhuma chamada de modelo” não significa “Vercel e Supabase ilimitados e gratuitos”. Nenhum plano, assinatura ou limite foi alterado nesta entrega.

## Implementação da entrega

- Guarda de orçamento em `server/budget-policy.mjs`, usada antes da resolução de provedor em `api/jarvis-chat.ts` e no handler. Somente `JARVIS_METERED_AI_ENABLED=true` habilita geração; ausente, false ou formatos não exatos bloqueiam antes de quota/modelo. Não ativar sem nova autorização de gasto ou franquia devidamente verificada.
- Interface padrão de orçamento zero. `VITE_JARVIS_METERED_AI_ENABLED=true` controla somente a apresentação; não autoriza o servidor. Nenhuma flag foi ativada nesta rodada.
- `api/jarvis-capture.ts` verifica autenticação e associação ao piloto, sem obter credenciais de provedor, e usa a tabela existente `solia_memories` com bearer do usuário e RLS.
- Captura privada explícita, original preservado, ID UUIDv4 do envio, confirmação de ID retornado pelo banco. Não grava histórico de IA nem interpretações biográficas.
- Nova tentativa com o mesmo ID após confirmação perdida: conflito de inserção seguido de leitura limitada por ID/dono; só confirmar se conteúdo e dono coincidirem. Não usar upsert de atualização, não sobrescrever e não repetir automaticamente uma escrita ambígua.
- Tela conserva o texto durante falha e o mesmo identificador enquanto o conteúdo não mudar. Fechar/recarregar a página antes da confirmação pode perder um rascunho; não existe fila offline durável nesta entrega.
- Consulta pelo cofre existente. Pesquisa textual, sem inferência semântica nova.
- “Ouvir texto” usa somente voz em português marcada como `localService=true` pelo navegador. Se não houver, informar indisponibilidade, sem fallback para serviço de voz remoto. Isso não clona a voz de Sol.
- Parar leitura ao ocultar a página ou desmontar a tela. Nenhuma escuta permanente, biometria vocal ou gravação oculta.
- Nenhuma migração ou alteração de RLS em produção.

A escolha de modo da fixture de navegador via URL existe SOMENTE no mock de testes. Produção não usa URL para autorizar despesas.

## ElevenLabs e caminho próprio

A [documentação da ElevenLabs](https://elevenlabs.io/docs/eleven-api/concepts/voice-cloning) descreve síntese condicionada por amostra de voz para clonagem instantânea e ajuste de pesos do modelo na clonagem profissional. Essas categorias técnicas são conhecidas; o serviço comercial não publica aqui todos os pesos, dados e detalhes de sua implementação.

Construir o sistema próprio pode aproveitar modelos abertos e código próprio de integração, memória, fila, edição e reprodução. Não declarar que reimplementamos a tecnologia proprietária nem garantir qualidade equivalente.

Candidato pesquisado: [Chatterbox, da Resemble AI](https://github.com/resemble-ai/chatterbox), com licença MIT no código e versões multilíngues que incluem português. O repositório documenta execução em CPU/CUDA/MPS e uso de amostra de áudio para síntese. Antes de incorporar, fixar revisão de código e pesos, verificar licença de cada artefato, requisitos e desempenho no equipamento real. Não confundir variante pequena em inglês com suporte ao português.

Não foram instalados pesos, treinado modelo ou gerada clonagem nesta rodada. Não há amostra de voz fornecida para esse teste, nem diagnóstico atual de RAM, chip e espaço livre do computador de Sol. Não presumir que o ambiente de desenvolvimento na nuvem seja seu Mac ou um servidor pessoal permanente.

Próxima prova local: verificar equipamento → ambiente isolado → modelo e licença fixados → gravação autorizada da própria Sol → síntese de texto fictício → ouvir identidade, pronúncia, naturalidade e medir tempo/RAM → avaliar se atende conteúdo gravado e/ou conversa ao vivo. Uma chamada de API dispensada pode transferir custo para hardware, energia e manutenção.

Antes de hospedar continuamente ou abrir acesso pelo iPhone, verificar autenticação, transporte seguro, disponibilidade do computador e nenhum endpoint público sem controle. Voz clonada não deve funcionar como chave de autenticação do próprio Jarvis.

## Evidência nova no iPhone

Relato direto da Sol durante esta rodada: “o Jarvis abriu pelo ícone na tela do iPhone, ele pediu login depois enviou um código por e-mail”.

- Confirmado por relato da usuária: instalação/abertura pelo ícone.
- Confirmado por relato: nessa abertura houve fluxo de login e envio de código.
- Ainda não confirmado: código aceito nessa instância, sessão mantida após novo fechamento, expiração/renovação prolongada, bloqueio com Face ID ou identificação segura de quem fala.
- Não pedir novamente evidência de instalação já recebida.

## Segurança sem login repetitivo

Novo requisito: outra pessoa com o telefone não deve usar o Jarvis como se fosse Sol. Manter login persistente é diferente de manter toda operação liberada indefinidamente.

Decisão de arquitetura:
1. Autenticação da conta conservada com renovação de sessão.
2. Chave-senha/passkey com verificação do usuário no dispositivo para acesso e confirmação relevante; Face ID quando disponibilizado pelo iPhone. Não prometer Face ID exclusivo quando o sistema permite código do aparelho.
3. Confirmação recente para exportar dados íntimos, conectar contas, autorizar ações externas e mudar segurança; não pedir um código por frase.
4. Estado e política verificados pelo servidor. Uma cortina visual ou variável local não é barreira de segurança.
5. Modo público/visitante separado: nenhuma memória íntima e nenhuma fala de terceiro incorporada ao Perfil DNA da Sol.
6. Voz pode orientar ativação/interação, mas não será credencial suficiente nem comprovação de identidade. Testar gravações, voz sintetizada, ruído, terceiros e falhas sem expor conteúdo.

O [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html) rejeita comparação biométrica baseada em voz para autenticação dentro de suas diretrizes. Isso reforça a escolha técnica; não afirmar que o aplicativo está certificado NIST.

O [Supabase documenta passkeys](https://supabase.com/docs/guides/auth/passkeys), ainda experimentais, a partir de supabase-js 2.105.0. A instalação local conferida tem 2.110.8. Ativação requer configuração do projeto, RP ID/domínio estável e origens permitidas, além de cadastro da chave no dispositivo. Trocar RP ID invalida chaves anteriores. Não cadastrar contra URL efêmera de deployment nem usar todo vercel.app como domínio.

Nenhuma passkey foi cadastrada, nenhuma política de confirmação adicional foi ativada e nenhuma biometria foi instalada no iPhone nesta entrega. O conector Supabase disponível não expõe edição de configuração Auth. Não contornar isso alterando tabelas internas de autenticação por SQL. Preparar/validar o fluxo com a configuração apropriada antes de declarar proteção pronta.

O iOS também oferece [bloqueio de apps](https://support.apple.com/pt-br/guide/iphone/iph00f208d05/ios). É proteção do aparelho, configurada nele. A presença dessa opção no web app instalado de Sol não foi confirmada e não deve ser presumida.

## Critérios para encerrar a etapa de proteção

- Cadastro e autenticação reais no mesmo iPhone e origem estável; cancelamento não libera dados.
- Terceiro sem credencial não acessa cofre, mesmo com gravação da voz de Sol.
- Validação no servidor: challenge expirado/reutilizado, origem errada, outra conta e sessão sem confirmação recente recusados.
- Cadastro/troca/remoção de credenciais exigem confirmação forte existente e recuperação definida.
- Abrir/fechar não volta ao e-mail desnecessariamente; confirmar frequência e conforto com uso real.
- Não coletar template biométrico de Face ID no servidor; usar provas criptográficas do autenticador.
- Não tratar chave-senha como prova permanente de quem está falando perto de uma sessão já aberta.

## Continuidade dos requisitos

A ordem permanece: orçamento sob controle e captura verificável; acesso pessoal forte com baixa fricção; continuidade de decisões/tarefas; motor local avaliado; integrações e voz avançada. O objetivo comercial e de legado permanece registrado. Não há promessa de renda ou de substituir toda uma equipe sem custo.

Sol não precisa fornecer documentos agora para esta entrega. Fontes serão necessárias quando chegarmos à importação efetiva dos livros/documentos; gravação da própria voz, quando houver equipamento/modelo prontos para ensaio. Solicitar o mínimo que estiver faltando naquele momento, sem pedir que ela reconstitua a vida de memória.
