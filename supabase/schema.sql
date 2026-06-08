-- Sol.IA — Sistema Neural / Eu Nao Desapareco
-- Supabase schema

create table if not exists core_facts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text default 'identity',
  priority integer default 1,
  is_locked boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('OBRA','METODO','OFERTA','MAQUINA','ESTACIONAMENTO')),
  status text default 'active',
  description text,
  current_phase text,
  next_action text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  type text not null,
  title text,
  content text not null,
  tags text[] default '{}',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  book_title text not null,
  season text,
  chapter_number integer,
  chapter_title text,
  content text,
  status text default 'draft',
  version integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  title text not null,
  document_type text,
  content text,
  source text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  decision text not null,
  reason text,
  is_current boolean default true,
  created_at timestamptz default now()
);

create table if not exists artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  title text not null,
  artifact_type text,
  content text,
  file_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  title text not null,
  status text default 'open',
  priority integer default 3,
  next_step text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists prompt_versions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text not null,
  content text not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_projects_category on projects(category);
create index if not exists idx_memories_type on memories(type);
create index if not exists idx_memories_tags on memories using gin(tags);
create index if not exists idx_documents_tags on documents using gin(tags);
create index if not exists idx_chapters_book on chapters(book_title);

insert into core_facts (title, content, category, priority, is_locked)
values (
  'Fato Intocavel 001 — Oripe',
  'Sol nasceu no mesmo dia em que Oripe morreu. Oripe era o irmao unico da mae. Nunca perguntar que idade Sol tinha quando Oripe morreu; ela estava nascendo. Esse e o eixo do luto transgeracional da historia.',
  'obra',
  1,
  true
)
on conflict do nothing;

insert into projects (name, category, status, description, current_phase, next_action)
values
('OBRA — Morte em Vida / Eu Nao Desapareco', 'OBRA', 'active', 'Livro, autobiografia, capitulos, personagens, linha do tempo e fatos intocaveis.', 'consolidacao', 'Proteger fatos intocaveis e organizar capitulos.'),
('METODO — Posicione-se / Relacione-se / Arvore do Discernimento', 'METODO', 'active', 'Metodo autoral, pedagogia, comandos, cajueiro e discernimento.', 'consolidacao', 'Criar memoria pedagogica oficial.'),
('OFERTA — Magnetus / Antidoto / Conteudo e Vendas', 'OFERTA', 'active', 'Produtos, paginas, funis, stories, criativos, DM e vendas.', 'organizacao', 'Classificar materiais e reaproveitar agente de neuromarketing.'),
('MAQUINA — Sol.IA Sistema Neural / Publisher / Tecnologia', 'MAQUINA', 'active', 'App, Supabase, GitHub, Vercel, APIs, Publisher e automacoes.', 'fundacao', 'Conectar app ao banco e validar memoria.'),
('ESTACIONAMENTO — Ideias futuras', 'ESTACIONAMENTO', 'active', 'Ideias boas que nao devem roubar foco agora.', 'ativo', 'Guardar sem executar.')
on conflict do nothing;
