# Plano Diretor — Redesign Visual Jarvis / SOL-IA

> Criado em 25/09/2026. Este plano parte do snapshot imutável `snapshot/pre-visual-redesign-20260925` e será executado somente na branch `work/jarvis-visual-redesign-20260925` até homologação da Sol.

## 1. Objetivo

Transformar a aparência atual do Jarvis em uma experiência de tecnologia avançada, cinematográfica e funcional — algo entre central de comando, radar tático, HUD aeroespacial e inteligência neural — sem virar fantasia visual barulhenta nem prejudicar leitura, velocidade, acessibilidade ou uso no iPhone.

A sensação desejada é:

**"estou conversando com uma inteligência viva dentro de uma central de comando"**

e não:

**"estou em um site com tema futurista".**

## 2. Regra absoluta de segurança

O redesign é visual.

Não alterar durante a fase visual:
- autenticação;
- memória/Cofre;
- Gemini Live;
- GPT-Live;
- speaker-ID;
- lógica de chat;
- Supabase;
- APIs;
- regras de custo;
- permissões;
- contratos;
- rotas;
- comportamento de produção.

Qualquer mudança funcional necessária para suportar a interface deve ser isolada, testada e justificada.

Fluxo obrigatório:

`snapshot → work branch → preview → comparação → homologação → produção`

Nunca trabalhar visualmente direto em `main`.

## 3. Snapshot congelado

Base de segurança:
- branch: `snapshot/pre-visual-redesign-20260925`
- commit congelado: `b9a09c2b3bdff30ff4b02620919e19ccce50e647`
- produção correspondente estava READY na Vercel antes do início do redesign.

Se qualquer capacidade desaparecer durante o redesign, comparar com esse snapshot.

## 4. Direção visual

Nome interno do sistema visual:

**JARVIS MISSION CONTROL / NEURAL RADAR**

### Linguagem

- fundo quase preto/obsidiana;
- superfícies grafite translúcidas;
- vidro técnico discreto;
- linhas finas de telemetria;
- radar concêntrico;
- grade técnica de profundidade;
- scan sweep lento e sutil;
- sinais de status vivos;
- brilho controlado;
- tipografia limpa + monoespaçada em dados;
- números, estado, conexão e sensores com aparência de instrumentação;
- nada de neon espalhado sem função.

### Evitar

- excesso de roxo genérico;
- aparência gamer;
- cyberpunk poluído;
- telas cheias de bordas;
- animações constantes sem propósito;
- texto pequeno demais;
- interface que parece "filme dos anos 2000";
- sacrificar clareza por efeito especial.

## 5. Paleta proposta

Base:
- Obsidian: `#020608`
- Graphite: `#071015`
- Deep Glass: `rgba(8, 20, 25, .78)`
- Panel Edge: `rgba(96, 220, 220, .18)`

Energia:
- Radar Cyan: `#42F5E9`
- Signal Blue: `#5EA7FF`
- Neural Violet: `#8B6CFF`

Estado:
- Online Green: `#43F59A`
- Warning Amber: `#FFC857`
- Alert Red: `#FF6577`

Texto:
- Primary: `#EAF7F7`
- Secondary: `#90A8AC`
- Muted: `#60757A`

O violeta atual deixa de ser dominante e passa a ser assinatura neural secundária. O ciano/verde assume a sensação de radar/sistema ativo.

## 6. Hierarquia visual

### A. Núcleo Jarvis

O atual `.neural-orb` evolui para um **Radar Core**:
- anéis concêntricos;
- sweep rotativo lento;
- pulso de atividade;
- estados visuais: idle, listening, thinking, speaking, warning;
- animação reduzida automaticamente quando `prefers-reduced-motion` estiver ativo.

O Radar Core deve parecer o "coração" do Jarvis, não um enfeite.

### B. Top bar / status

Converter o topo em uma faixa de instrumentação:
- JARVIS;
- status da sessão;
- motor ativo;
- memória/cofre;
- conexão;
- microfone;
- modo privado/público;
- versão.

No celular, colapsar de forma limpa.

### C. Navegação

Manter as quatro áreas atuais:
- Conversar;
- Conhecimento;
- Cofre;
- Integrações.

Mudar aparência para tabs técnicas de central de comando, sem alterar rotas ou comportamento.

### D. Conversa

A conversa continua sendo o centro da experiência.

Melhorias:
- mensagens menos "cards comuns";
- resposta do Jarvis com assinatura de sistema;
- fala da usuária claramente distinta;
- linha de estado contextual;
- input como console natural, não terminal técnico;
- microfone e envio mais evidentes.

### E. Voz ao vivo

O módulo Live deve parecer um subsistema de comunicação:
- motor;
- voz;
- estado;
- sessão;
- custo;
- waveform/atividade apenas se existir dado real;
- erro em linguagem clara;
- botão de iniciar/encerrar impossível de confundir.

Não inventar medidores falsos.

## 7. Profundidade e movimento

Movimento deve comunicar estado.

Permitido:
- sweep de radar lento;
- pulso quando ouvindo;
- micro glow em conexão;
- scan line ocasional;
- atualização suave de indicadores;
- transições de 150–300 ms.

Proibido:
- elementos piscando continuamente;
- parallax pesado;
- chuva de código;
- partículas que consomem bateria;
- animação que atrapalha leitura;
- fake data.

## 8. Tipografia

Remover gradualmente a dependência visual de Georgia/Times nas áreas de sistema.

Direção:
- interface: system/Inter-like;
- telemetria/status: ui-monospace / SF Mono / Menlo;
- títulos: sans geométrica/clean usando fontes seguras já disponíveis no sistema.

Não adicionar dependência externa de fonte sem necessidade.

## 9. Responsividade

O iPhone é prioridade igual ao desktop.

Obrigatório:
- targets de toque >= 44 px;
- navegação sem scroll confuso;
- input sempre acessível;
- respeitar safe areas;
- contraste adequado;
- teclado não cobrir ação principal;
- Radar Core não ocupar espaço inútil;
- nenhuma animação pesada em background.

## 10. Fases de execução

### Fase V0 — congelamento
Concluída:
- snapshot criado;
- branch de trabalho criada;
- produção atual preservada.

### Fase V1 — Design Tokens
Alterar somente variáveis visuais:
- cores;
- bordas;
- superfícies;
- sombras;
- tipografia;
- motion tokens.

Provar que nenhuma lógica mudou.

### Fase V2 — Shell + Radar Core
Redesenhar:
- body/background;
- hero;
- top status;
- navegação;
- radar central.

### Fase V3 — Conversa
Redesenhar:
- mensagens;
- input;
- estados;
- sugestões;
- modo público/privado.

### Fase V4 — Voz
Redesenhar `JarvisLiveVoice` mantendo o contrato atual intacto.

### Fase V5 — Gavetas
Aplicar identidade a:
- Conhecimento;
- Cofre;
- Integrações;
- painéis internos.

### Fase V6 — Motion + polish
Adicionar movimento técnico somente onde comunica estado.

### Fase V7 — QA
Validar:
- desktop;
- iPhone;
- redução de movimento;
- teclado;
- contraste;
- navegação;
- estados de erro;
- loading;
- voz;
- login;
- memória;
- build;
- contratos.

## 11. Critérios de aceite

O redesign só pode ser promovido se:

1. todas as funções do snapshot continuarem disponíveis;
2. contratos existentes passarem;
3. build passar;
4. Preview Vercel ficar READY;
5. não houver nova chave/segredo;
6. login e memória não forem alterados;
7. voz continuar com os mesmos controles;
8. mobile ficar utilizável;
9. interface parecer Jarvis/central de comando, não apenas uma troca de cor;
10. rollback para o snapshot permanecer imediato.

## 12. Estratégia de homologação

A Sol não precisa revisar código.

Entregar para homologação:
- URL Preview;
- 3–5 telas-chave;
- comparação antes/depois;
- lista curta do que mudou visualmente;
- confirmação explícita de que funcionalidades foram preservadas.

Somente após aprovação visual:
- merge para `main`;
- produção;
- verificação final.

## 13. Princípio de produto

A interface deve transmitir:

**presença + inteligência + controle + segurança + antecipação.**

O usuário deve sentir que o Jarvis está "vivo e atento", mas sempre sob comando.

A estética serve à sensação de inteligência operacional. Ela não substitui a inteligência.
