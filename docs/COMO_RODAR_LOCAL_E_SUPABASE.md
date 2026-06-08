# Como rodar a Sol.IA localmente e conectar ao Supabase

## 1. Baixar o repositório

```bash
git clone https://github.com/Sollimastudio/SOL-IA.git
cd SOL-IA
```

## 2. Instalar dependências

```bash
npm install
```

## 3. Criar arquivo de ambiente

Na raiz do projeto, crie um arquivo chamado `.env.local`.

Conteúdo:

```bash
VITE_SUPABASE_URL=cole_a_url_do_supabase_aqui
VITE_SUPABASE_ANON_KEY=cole_a_chave_anon_aqui
```

Nunca coloque chaves secretas no GitHub.

## 4. Criar as tabelas no Supabase

1. Abra o painel do Supabase.
2. Entre no projeto da Sol.IA.
3. Vá em SQL Editor.
4. Abra o arquivo `supabase/schema.sql` deste repositório.
5. Copie o conteúdo.
6. Execute no SQL Editor.

Isso cria:
- core_facts
- projects
- memories
- chapters
- documents
- decisions
- artifacts
- tasks
- prompt_versions

## 5. Rodar localmente

```bash
npm run dev
```

Abra o endereço mostrado pelo Vite no navegador.

## 6. Testar o fluxo mínimo

1. Digite uma ideia bruta.
2. Clique em Traduzir, avaliar e salvar.
3. Veja a classificação.
4. Veja a Skill Visionária.
5. Confira se apareceu mensagem de salvamento.
6. No Supabase, veja a tabela `memories`.

## 7. Testar voz

Use preferencialmente Chrome.

Clique em Capturar por voz.
Permita acesso ao microfone.
Fale uma ideia.
A Sol.IA deve transcrever, classificar, avaliar e tentar salvar.

## Status esperado

Se Supabase estiver configurado:
- a ideia deve ser salva em `memories`.

Se Supabase nao estiver configurado:
- a Sol.IA deve processar localmente e avisar que o Supabase ainda nao foi configurado.

## Proximo passo depois do teste

Conectar deploy na Vercel e configurar as mesmas variáveis de ambiente no painel da Vercel.
