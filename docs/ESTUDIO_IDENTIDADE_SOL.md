# Estúdio pessoal — ideia, voz, rosto e expressão

Decisão de produto atualizada em 13/09/2026, após esclarecimento direto de Sol. Complementa orçamento zero e segurança; não encerra suas pendências.

## Pedido compreendido

Sol quer falar uma ideia naturalmente e receber roteiro, narração e vídeo com sua voz, rosto, jeito de falar, expressões, gestos e movimentos, sem gravar novamente para cada conteúdo. Referências funcionais citadas: ElevenLabs e HeyGen. Não reduzir o pedido a notas, voz padrão do telefone ou imagem parada. Quer uma máquina própria e o máximo de execução sem novas despesas, aproveitando sua assinatura ChatGPT.

Exemplo de intenção: uma reflexão sobre como notícias falsas e injustiças levam a questionar narrativas históricas. Registrar como reflexão/ideia autoral. Não transformar desconfiança em prova de que todos os registros históricos são falsos, nem atribuir alegações inventadas à Sol. Roteiro proposto deve preservar a pergunta e distinguir opinião, dúvida e afirmações que precisam de fontes.

## Assinatura e custos

O trabalho dentro do ChatGPT/Codex usa os recursos e limites do plano existente. API é uma modalidade de uso com cobrança própria; não foi identificada autorização de gasto novo. Ver [preços do ChatGPT Work](https://learn.chatgpt.com/docs/pricing) e [API](https://developers.openai.com/api/docs/pricing).

Não embutir sessão/cookies do ChatGPT como backend de Vercel. Usar o ChatGPT como ambiente criativo e de desenvolvimento agora é diferente de oferecer o mesmo modelo funcionando autonomamente no Jarvis. A integração específica precisa ser permitida, implementada e verificada.

Não é preciso contratar HeyGen ou ElevenLabs para iniciar software próprio com componentes abertos. Isso não garante custo total zero: inferência exige computador, memória, espaço, energia e tempo; pesos têm licenças próprias. Este ambiente de desenvolvimento é temporário, não o servidor permanente de Sol. Nenhum download grande, GPU, assinatura ou chamada de API foi contratado nesta etapa.

## Componentes e evidência esperada

| Capacidade | Implementação técnica | Prova necessária |
| --- | --- | --- |
| Entender e escrever no jeito de Sol | Modelo de linguagem, exemplos aprovados e memória versionada | Comparação de roteiro com a intenção original e correções da Sol |
| Dizer texto novo na voz dela | Síntese condicionada por amostra de voz, representação do locutor e geração de áudio | Áudio novo em português; ouvir semelhança, pronúncia, naturalidade e medir tempo |
| Fazer seu rosto falar | Modelo de animação facial e sincronização labial guiada pelo áudio | Vídeo novo; correspondência boca/fala, identidade estável, sem deformação |
| Reproduzir trejeitos e movimentos | Referências de atuação, controle temporal e modelo de movimento | Comparação de expressões, pausas, cabeça, mãos e corpo; não confundir movimento genérico com aprendido |
| Entregar conteúdo utilizável | Montagem, cortes, legendas e exportação | MP4 reproduzível, formato correto, áudio íntegro, revisão antes de publicar |

Python/PyTorch são ferramentas adequadas para inferência local; FFmpeg realiza preparação e montagem. Não afirmar que esta é a implementação interna exata da HeyGen. Sua [documentação pública](https://developers.heygen.com/models) descreve modelos de voz e motores de avatar, mas não entrega todo o treinamento, os pesos ou o código proprietário para reprodução integral.

A base própria poderá combinar código do Jarvis e modelos abertos licenciados. Não dizer que treinamos uma tecnologia fundamental do zero ou que possuímos todos os componentes de terceiros. Não garantir equivalência a uma plataforma comercial antes do teste real.

## Entrega executada nesta rodada

`local_studio/` inclui preparação de referências, preservação do roteiro/ideia, trabalho persistido, narração com procedência, adaptador opcional Chatterbox Multilingual V3 em português e exportação de prévia MP4 vertical com imagem estática. Há comando de diagnóstico da máquina e testes independentes.

- Preparação e montagem foram executadas com mídia sintética; não usam API de IA.
- O adaptador de voz foi escrito contra o código oficial fixado; contrato e falhas testados. Não há modelo instalado, áudio real da Sol gerado ou identidade vocal aprovada.
- Não existe sincronização labial ou geração de gestos nesta entrega.
- Este worker é local, ainda sem ligação ao aplicativo do iPhone. Não há botão falso indicando geração pronta.
- Roteiros longos não são cortados escondidos: ensaio de síntese limitado a 300 caracteres. Divisão/alinhamento virão depois.
- Testes de mídia e testes com substituto de modelo são identificados separadamente.

Fonte de voz examinada: [Chatterbox](https://github.com/resemble-ai/chatterbox/tree/5de7a54aa4e5e2baadb0182dde554908b48b85c2). Código principal fixado; pesos e ambiente completo ainda precisam de revisão/pinagem antes de instalar. O modelo multilíngue inclui português; a variante Nano em inglês não atende o requisito de Sol.

Fontes candidatas para animação: [LivePortrait](https://github.com/KlingAIResearch/LivePortrait), com referências de movimento; antes de uso comercial, examinar também licenças dos pesos e dependências. Não ativado. Sincronização por áudio e imitação pessoal de gestos não estão comprovadas por simplesmente instalar LivePortrait.

## Próxima sequência executável

1. Uma gravação própria curta, com rosto visível e voz limpa, pode alimentar a extração inicial de áudio/imagem; material existente pode servir. Primeira avaliação em 20–30 segundos, sem música/filtro de voz e com uma pessoa falando. Isso não é promessa de capturar todos os movimentos em um único trecho.
2. Confirmar chip, memória e espaço ATUAIS do computador que executará os modelos. O diagnóstico da nuvem não substitui o do Mac; não reutilizar como atual um problema antigo de disco cheio.
3. Preparar ambiente isolado e pesos licenciados fixos; executar primeira fala nova em português; ouvir/medir. Não inferir sucesso pela existência de um WAV.
4. Adicionar animação guiada pelo áudio e comparar identidade, boca, dentes, olhos e movimentos. Gestos pessoais exigem referências representativas e nova avaliação.
5. Integrar trabalho ao Jarvis no iPhone com autenticação forte, arquivos privados e recuperação de falhas. Publicação externa permanece sob autorização; clonagem não é credencial de login.

Sol não precisa escolher bibliotecas, escrever prompts técnicos nem lembrar a lista de engenharia. O único material pessoal novo necessário ao ensaio é uma referência de sua própria voz/rosto, além da identificação do equipamento. Não solicitar acervo biográfico ou documentos médicos para esse recurso.
