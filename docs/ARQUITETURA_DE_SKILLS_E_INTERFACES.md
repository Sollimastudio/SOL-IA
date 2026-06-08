# Arquitetura de Skills e Interfaces — Sol.IA

## Decisao executiva

A Sol.IA oficial deve ter uma interface principal inspirada no prototipo do Google AI Studio, com menu de skills, painel neural e modulos especializados.

A tela simples atual da Vercel e apenas MVP minimo de validacao. Ela nao e a interface final.

## Regra

Nao criar duas Sol.IA concorrentes.

A interface rica do prototipo deve ser migrada para o app oficial da Vercel.

## Interfaces

### 1. Interface Principal — Neural Console

Inspirada no prototipo Google AI Studio.

Componentes:
- menu lateral ou superior de skills
- status da IA
- Vault Central
- Imperatriz / modo comando central
- entrada por texto
- captura por voz
- anexos
- resposta em modo conversa
- classificacao automatica

### 2. Interface Simplificada — Modo Despejo

A interface atual da Vercel continua como modo simples para:
- capturar ideias
- testar voz
- testar Supabase
- validar Skill Visionaria

## Skills principais

### 1. Diretoria Executiva
Traduz caos, classifica, decide prioridade e entrega proximo passo.

### 2. Prompt Autopilot
Cria o prompt profissional interno antes de responder.

### 3. Skill Visionaria
Avalia oportunidades em ideias brutas.

### 4. Lex Vanguard
Guardiao juridico-preventivo.
Supervisiona riscos legais, contratos, ofertas, promessas, impulsos de negocio e exposicao publica.
Nao substitui advogado humano, mas alerta riscos e recomenda cautela.

### 5. Vault Central
Cofre de memorias, fatos intocaveis, projetos, capitulos, decisoes e documentos.

### 6. Publisher
Escrita, revisao, diagramacao e exportacao editorial.

### 7. Relacione-se / Metodo Posicione-se
Pedagogia autoral, Arvore do Discernimento, Cajueiro, comandos e mentoria.

### 8. Oferta e Neuromarketing
Magnetus, Antidoto, funil, copy, conteudo, anuncios, DM e vendas.

### 9. Motion / Video
Roteiros, cortes, legendas, edicao, prompts visuais e performance.

### 10. Vida Diaria / Guardiao de Impulso
Ajuda Sol no cotidiano, especialmente com impulsividade, dispersao, insonia, oscilacao, excesso de ideias e decisoes emocionais.

## Modos de protecao

### Modo Pausa Obrigatoria
Quando detectar negocio por impulso, compra, contrato, proposta, investimento, exposicao publica ou decisao sensivel, a Sol.IA deve desacelerar e acionar Lex Vanguard.

### Modo 3 da Manha
Captura ideias durante insonia, salva e adia decisao executiva para depois.

### Modo Publico / Performance
Durante live/story/video, responde curto, seguro e sem expor dados intimos.

### Modo Privado
Pode acessar memorias profundas, mas deve proteger Sol de impulsividade e exposicao desnecessaria.

## Proxima implementacao

Criar estrutura `src/skills/` com os modulos:
- executive
- promptAutopilot
- visionary
- lexVanguard
- vault
- publisher
- dailyGuardian

Criar UI com menu de skills em `src/App.tsx`.
