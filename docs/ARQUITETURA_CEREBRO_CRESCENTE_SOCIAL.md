# Jarvis / Sol.IA — cérebro crescente, autoatualização e inteligência social

## Princípio

O Jarvis não deve depender de um único provedor/modelo nem confundir o app ChatGPT com o seu próprio cérebro. O produto mantém memória, perfil, projetos, permissões e continuidade em infraestrutura própria. Modelos externos entram como motores substituíveis por tarefa.

## 1. Cérebro principal

Arquitetura por camadas:

- `Jarvis Core`: identidade operacional, contexto, anti-fadiga, estado da conversa e políticas.
- `Model Router`: escolhe o modelo/provedor por tarefa, custo, latência e capacidade.
- `Tool Router`: arquivos, web, código, calendário, redes sociais, analytics e demais ferramentas autorizadas.
- `Memory/Knowledge`: memória privada, perfil autoral, fontes versionadas e estado dos projetos.
- `Agent Orchestrator`: coordena especialistas sem exigir que a usuária escolha agente.

A OpenAI pode ser o cérebro principal via API. Não se embute a sessão pessoal do aplicativo ChatGPT. O Jarvis chama modelos da OpenAI pela API e combina as respostas com a memória/estado próprios.

Para o piloto, manter suporte ao backend existente e adicionar um adaptador de OpenAI Responses API em etapa controlada. O provedor deve ser configurável no servidor. Chaves nunca vão para o navegador.

## 2. Uso de OpenAI dentro do Jarvis

A Responses API pode receber texto/imagem/arquivos, usar web search, file search, funções próprias, MCP e outras ferramentas permitidas. Isso permite aproximar a experiência do ChatGPT dentro do Jarvis sem depender da interface do ChatGPT.

Para voz, usar uma camada Realtime apropriada quando validada no iPhone, mantendo wake word/privacidade como problema separado do modelo de voz.

## 3. Inteligência crescente

“Crescente” não significa modificar pesos do modelo ou aprender qualquer inferência como verdade. Significa melhorar o sistema continuamente com dados verificáveis:

- lembrar correções e preferências;
- consolidar decisões;
- comparar resultados de conteúdo e campanhas;
- aprender quais formatos performam melhor para cada objetivo;
- aprimorar o perfil de voz/estilo por exemplos aprovados/rejeitados;
- detectar perguntas repetidas pelo próprio Jarvis e reduzir redundância;
- testar novos modelos e ferramentas em benchmark próprio;
- promover somente melhorias que superem a baseline sem quebrar segurança/qualidade.

## 4. Radar de novidades / autoatualização

Criar um `Capability Radar` periódico que monitore apenas fontes autorizadas e confiáveis:

- changelogs e documentação de OpenAI, Meta, TikTok, Vercel, Supabase e demais fornecedores usados;
- releases de SDKs e dependências do projeto;
- novos modelos, limites, preços, ferramentas e depreciações;
- mudanças relevantes de APIs sociais;
- vulnerabilidades de dependências.

Fluxo:
1. coletar novidade;
2. classificar impacto no Sol.IA;
3. registrar oportunidade/risco;
4. reproduzir ou prototipar em branch/sandbox;
5. rodar testes comparativos;
6. abrir PR com evidências;
7. promover apenas após gates.

O Radar não altera produção sozinho, não troca modelo principal sem benchmark e não cria custo ilimitado.

## 5. Social Intelligence Hub

Objetivo: conectar contas autorizadas da usuária e aprender com o comportamento agregado do público sem expor dados além do necessário.

Conectores previstos:

### Instagram profissional
- múltiplas contas Business/Creator;
- mídia, métricas e insights permitidos pela API;
- performance por formato, tema, gancho, duração, CTA e horário;
- publicação somente quando a permissão/fluxo oficial permitir e com política de aprovação.

### Facebook Pages
- múltiplas páginas;
- conteúdo e Page Insights conforme permissões aprovadas;
- análise de alcance, engajamento e desempenho por ativo;
- ações de publicação somente com escopo e aprovação adequados.

### TikTok
- perfil e vídeos via APIs permitidas;
- Content Posting API para rascunho/publicação quando aplicativo e escopos estiverem aprovados;
- métricas disponíveis conforme o produto/escopo concedido.

Nenhum conector deve presumir acesso a contas pessoais/privadas que a API não expõe.

## 6. Audience Strategy Engine

O Jarvis deve aceitar um objetivo de audiência explícito, por exemplo:

- maior poder aquisitivo;
- faixa etária;
- região;
- interesses e temas;
- nível de profundidade do conteúdo;
- intenção (autoridade, alcance, venda, comunidade, livro, Magnetus etc.).

Evitar rótulos depreciativos ou inferir inteligência, pobreza, saúde, raça, religião, política ou outras características sensíveis de indivíduos. Para estratégia, trabalhar com sinais agregados e segmentações permitidas pelas plataformas, como comportamento de conteúdo, localização ampla, interesses/engajamento disponibilizados, dispositivo/canal e performance observada.

O sistema deve traduzir “quero um público classe média alta e mais posicionado” em critérios operacionais verificáveis: ticket esperado, temas, linguagem, canais, localização agregada, conteúdo, oferta e métricas de qualidade — não em uma tentativa de classificar pessoas individualmente como “inteligentes” ou “pobres”.

## 7. Loop de aprendizagem de conteúdo

Para cada conteúdo:

1. registrar hipótese e objetivo;
2. registrar versão publicada;
3. coletar métricas permitidas em janelas definidas;
4. normalizar por tamanho da audiência/tempo/alcance;
5. atribuir sinais a gancho, tema, formato, duração, CTA e estilo;
6. comparar com baseline e conteúdos similares;
7. atualizar recomendações com nível de confiança;
8. nunca transformar correlação em causalidade sem teste suficiente.

O Jarvis deve responder “o que meu público está preferindo?” com evidências e período analisado.

## 8. Personalização da Sol

Manter perfis separados:

- privado;
- conteúdo;
- editorial;
- institucional;
- comercial;
- performance/live.

Aprender jargões, pronúncias, sarcasmo, ritmo, frases aprovadas/rejeitadas e padrões de escrita. Atualizações precisam ser versionadas e reversíveis.

## 9. Relatórios sob demanda

O Jarvis não deve despejar relatórios pessoais sem necessidade. Por padrão, conduz silenciosamente. Relatórios aparecem quando a usuária pedir ou quando existir risco operacional relevante que justifique um parecer curto.

Relatórios possíveis:
- progresso operacional pessoal;
- projetos e loops abertos;
- conteúdo/audiência;
- campanhas;
- saúde técnica do próprio Jarvis;
- novidades tecnológicas relevantes.

## 10. Protótipo — ordem imediata

P0 — simplificar interface para uma única conversa + estado real.
P0 — motor anti-fadiga: raiz/galhos, repetição/novidade, loops abertos e retomada.
P0 — adaptador de modelo com OpenAI Responses API opcional, mantendo fallback atual.
P0 — fontes/memória versionadas já iniciadas.
P1 — voz em primeiro plano real e validação no iPhone; depois arquitetura nativa/wake word.
P1 — Capability Radar para novidades e self-checks técnicos.
P1 — Social Intelligence Hub somente leitura primeiro: Instagram/Facebook/TikTok.
P1 — Audience Strategy Engine e relatórios de conteúdo.
P2 — publicação assistida/aprovada nas redes.
P2 — voz personalizada/clone audiovisual e live.
P2 — self-healing supervisionado com patches em branch, testes e PR.
P3 — produto multiusuário e cobrança.

## Regra de ouro

A usuária fala com Jarvis. A complexidade acontece atrás dele. Todo novo recurso deve responder: isso reduz trabalho mental/operacional da usuária ou apenas adiciona mais uma tela para ela administrar?
