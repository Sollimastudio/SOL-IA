# Voz ao longo do tempo e conversa por vídeo

Atualização de 13/09/2026. Complementa `ESTUDIO_IDENTIDADE_SOL.md`; não substitui o trabalho de voz/avatar nem a segurança pendente.

## Novo pedido recebido

Sol forneceu uma gravação de voz e pediu que o Jarvis aprenda progressivamente seu jeito de falar, traços vocais e variações nas conversas. Quer edição de áudio/vídeo, redução de ruído e chamada por vídeo: conversar vendo o Jarvis, enquanto ele acompanha sua imagem. Não exigir nova explicação desse objetivo em cada rodada.

## Evidência da gravação

Foi recebido e decodificado um M4A com cerca de 3 minutos e 45 segundos, mono, 44,1 kHz. Foram calculadas medidas acústicas e preparado um candidato contínuo de dez segundos, além de cópia com tratamento leve. Original preservado. Relatório e derivados pessoais pertencem aos arquivos privados da Sol, não ao GitHub/CI.

O material tem duração suficiente para iniciar a seleção de referência, sem pedir outra gravação agora. A triagem não prova inteligibilidade, pessoa única falando, ausência de música ou semelhança de clonagem. Não houve escuta suportada neste ambiente, transcrição ou inferência real do modelo de voz; essas avaliações permanecem abertas. Não dizer que a voz já foi treinada ou clonada.

Código entregue: entrada somente de áudio no estúdio e `local_studio/audio.py`, com medição, seleção heurística, conversão e cópia de tratamento reversível. A referência usada para preservar identidade vocal não recebe denoiser; a edição é uma derivação separada, para não confundir mudanças de processamento com mudanças na voz da pessoa.

## Como aprender durante conversas

O aprendizado desejado exige registros e avaliações explícitos no produto, não a promessa de que qualquer conversa altera automaticamente os pesos de um modelo.

- Registrar vocabulário, formas de frase, preferências e correções com origem, data e versões; manter texto original junto à interpretação.
- Preservar referências vocais aprovadas em armazenamento privado, com versões e possibilidade de retirar/substituir uma referência.
- Medir características observáveis, como volume e pausas, sem convertê-las automaticamente em emoção, personalidade ou diagnóstico. Volume do microfone, distância e ruído também mudam essas medidas.
- Usar o que Sol relata sobre como se sente como fonte atribuída. Hipóteses contextuais de emoção devem ser incertas, corrigíveis e não virar fatos clínicos ou alertas por um sinal isolado.
- Não treinar a identidade de Sol com voz de terceiros, televisão ou participantes da live. Separação de locutor e confirmação de origem ainda não implementadas.
- Evitar relatórios de humor frequentes; adaptação deve ajudar a conversa. Não interromper para perguntar estado emocional a cada frase.
- Melhoria do modelo requer comparar versão anterior/nova, identidade e pronúncia, antes de promover. Manter retorno à versão anterior.

Nenhuma captura contínua, aprendizado de emoções, perfil vocal persistente no Supabase ou treinamento automático foi ativado nesta entrega.

## Chamada por vídeo — critérios de produto

Uma prévia da câmera não comprova videochamada com IA. A entrega deve integrar câmera, microfone, compreensão da fala/imagem, resposta falada e representação visual do Jarvis.

1. Iniciar a chamada por ação clara; obter permissões do aparelho e mostrar se câmera/microfone estão ativos. Encerrar deve parar as trilhas de captura e a voz reproduzida; testar ao ocultar/fechar a tela e após falhas.
2. Usar cancelamento de eco, supressão de ruído e controle de ganho quando suportados. Conferir configurações efetivamente aplicadas, não apenas solicitadas. Preservar uma referência separada e pouco processada para clonagem.
3. Permitir interrupção da fala do Jarvis pela Sol sem ele ouvir a própria voz e entrar em repetição; verificar reconexão e perda de áudio.
4. Para compreensão visual, selecionar quadros relevantes da câmera e enviar somente ao processador autorizado. Não prometer análise de imagem com o modelo remoto pausado ou sem motor local ativo.
5. Separar observação visual de reconhecimento de identidade/autorização. Ver uma face ou ouvir uma voz não substitui a proteção por dispositivo.
6. Avatar olhando para a câmera é renderização; não afirmar que uma animação sente, vê ou entende sem o caminho real de entrada/compreensão funcionando.
7. Medir atraso da resposta e sincronismo áudio/vídeo no iPhone real. O mesmo telefone em live continua exigindo ensaio específico de áudio, câmera e transmissão.

Base técnica prevista: APIs de mídia do navegador e WebRTC quando houver transporte em tempo real, processador de fala/imagem, síntese de voz e renderizador. [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) exige contexto seguro e permissão; [constraints de mídia](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints) precisam de confirmação de suporte. [FFmpeg](https://ffmpeg.org/ffmpeg-filters.html#afftdn) fornece processamento de arquivos; não confundir essa edição offline com cancelamento de eco em uma chamada.

Esta arquitetura está registrada; chamada de vídeo, análise visual ao vivo e avatar interativo ainda não foram implementados. Próxima prova do trabalho ativo continua sendo síntese real em português com a referência recebida, dependente de ambiente/modelo verificado. O equipamento da Sol ainda não foi identificado nesta conversa.
