-- Sol.IA — schema seguro para uma instalacao nova
--
-- Para um banco que ja possui as tabelas, NAO use este arquivo como migracao.
-- Execute: supabase/migrations/202607240100_secure_personal_data.sql
--
-- Depois do primeiro login, execute supabase/claim_existing_data.sql para
-- atribuir os registros iniciais ao usuario correto.

begin;

create extension if not exists pgcrypto;

create table if not exists public.core_facts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade default auth.uid(),
  title text not null,
  content text not null,
  category text default 'identity',
  priority integer default 1,
  is_locked boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  category text not null check (category in ('OBRA','METODO','OFERTA','MAQUINA','ESTACIONAMENTO')),
  status text default 'active',
  description text,
  current_phase text,
  next_action text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade default auth.uid(),
  project_id uuid references public.projects(id) on delete set null,
  type text not null,
  title text,
  content text not null,
  tags text[] default '{}',
  origin text not null default 'conversation',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade default auth.uid(),
  project_id uuid references public.projects(id) on delete set null,
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

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade default auth.uid(),
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  document_type text,
  content text,
  source text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade default auth.uid(),
  project_id uuid references public.projects(id) on delete set null,
  decision text not null,
  reason text,
  is_current boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade default auth.uid(),
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  artifact_type text,
  content text,
  file_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade default auth.uid(),
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  status text default 'open',
  priority integer default 3,
  next_step text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  version text not null,
  content text not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.memory_audit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  memory_id uuid not null,
  action text not null check (action in ('create', 'update', 'delete')),
  changes jsonb not null default '{}'::jsonb,
  performed_at timestamptz not null default now()
);

create index if not exists idx_core_facts_owner on public.core_facts(owner_id);
create index if not exists idx_projects_owner on public.projects(owner_id);
create index if not exists idx_projects_category on public.projects(category);
create index if not exists idx_memories_owner_created on public.memories(owner_id, created_at desc);
create index if not exists idx_memories_type on public.memories(type);
create index if not exists idx_memories_tags on public.memories using gin(tags);
create index if not exists idx_chapters_owner on public.chapters(owner_id);
create index if not exists idx_chapters_book on public.chapters(book_title);
create index if not exists idx_documents_owner on public.documents(owner_id);
create index if not exists idx_documents_tags on public.documents using gin(tags);
create index if not exists idx_decisions_owner on public.decisions(owner_id);
create index if not exists idx_artifacts_owner on public.artifacts(owner_id);
create index if not exists idx_tasks_owner on public.tasks(owner_id);
create index if not exists idx_prompt_versions_owner on public.prompt_versions(owner_id);
create index if not exists idx_memory_audit_owner_performed
  on public.memory_audit_logs(owner_id, performed_at desc);
create index if not exists idx_memory_audit_memory
  on public.memory_audit_logs(memory_id, performed_at desc);

alter table public.core_facts enable row level security;
alter table public.projects enable row level security;
alter table public.memories enable row level security;
alter table public.chapters enable row level security;
alter table public.documents enable row level security;
alter table public.decisions enable row level security;
alter table public.artifacts enable row level security;
alter table public.tasks enable row level security;
alter table public.prompt_versions enable row level security;
alter table public.memory_audit_logs enable row level security;

create policy core_facts_owner_select
  on public.core_facts for select
  to authenticated
  using (auth.uid() is not null and auth.uid() = owner_id);
create policy core_facts_owner_insert
  on public.core_facts for insert
  to authenticated
  with check (auth.uid() is not null and auth.uid() = owner_id);
create policy core_facts_owner_update_unlocked
  on public.core_facts for update
  to authenticated
  using (auth.uid() is not null and auth.uid() = owner_id and not is_locked)
  with check (auth.uid() is not null and auth.uid() = owner_id);
create policy core_facts_owner_delete_unlocked
  on public.core_facts for delete
  to authenticated
  using (auth.uid() is not null and auth.uid() = owner_id and not is_locked);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'projects',
    'memories',
    'chapters',
    'documents',
    'decisions',
    'artifacts',
    'tasks',
    'prompt_versions'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (auth.uid() is not null and auth.uid() = owner_id)',
      table_name || '_owner_select',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (auth.uid() is not null and auth.uid() = owner_id)',
      table_name || '_owner_insert',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (auth.uid() is not null and auth.uid() = owner_id) with check (auth.uid() is not null and auth.uid() = owner_id)',
      table_name || '_owner_update',
      table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (auth.uid() is not null and auth.uid() = owner_id)',
      table_name || '_owner_delete',
      table_name
    );
  end loop;
end
$$;

create policy memory_audit_owner_select
  on public.memory_audit_logs for select
  to authenticated
  using (auth.uid() is not null and auth.uid() = owner_id);

create or replace function public.audit_memory_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  audit_owner uuid;
  audit_memory uuid;
  audit_changes jsonb;
begin
  if tg_op = 'DELETE' then
    audit_owner := old.owner_id;
    audit_memory := old.id;
    audit_changes := jsonb_build_object('type', old.type, 'title', old.title);
  elsif tg_op = 'INSERT' then
    audit_owner := new.owner_id;
    audit_memory := new.id;
    audit_changes := jsonb_build_object('type', new.type, 'title', new.title, 'tags', new.tags);
  else
    audit_owner := new.owner_id;
    audit_memory := new.id;
    audit_changes := jsonb_build_object(
      'content_changed', new.content is distinct from old.content,
      'title_changed', new.title is distinct from old.title,
      'tags_changed', new.tags is distinct from old.tags,
      'metadata_changed', new.metadata is distinct from old.metadata
    );
  end if;

  if audit_owner is not null then
    insert into public.memory_audit_logs (owner_id, memory_id, action, changes)
    values (audit_owner, audit_memory, lower(tg_op), audit_changes);
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

revoke all on function public.audit_memory_change() from public;
revoke all on function public.audit_memory_change() from anon;
revoke all on function public.audit_memory_change() from authenticated;

create trigger memories_audit_trigger
after insert or update or delete on public.memories
for each row execute function public.audit_memory_change();

-- Registros canonicos nascem sem owner e ficam invisiveis ate a reivindicacao.
insert into public.core_facts (title, content, category, priority, is_locked)
values (
  'Fato Intocavel 001 — Oripe',
  'Sol nasceu no mesmo dia em que Oripe morreu. Oripe era o irmao unico da mae. Nunca perguntar que idade Sol tinha quando Oripe morreu; ela estava nascendo. Esse e o eixo do luto transgeracional da historia.',
  'obra',
  1,
  true
)
on conflict do nothing;

insert into public.projects (name, category, status, description, current_phase, next_action)
values
('OBRA — Morte em Vida / Eu Nao Desapareco', 'OBRA', 'active', 'Livro, autobiografia, capitulos, personagens, linha do tempo e fatos intocaveis.', 'consolidacao', 'Proteger fatos intocaveis e organizar capitulos.'),
('METODO — Posicione-se / Relacione-se / Arvore do Discernimento', 'METODO', 'active', 'Metodo autoral, pedagogia, comandos, cajueiro e discernimento.', 'consolidacao', 'Criar memoria pedagogica oficial.'),
('OFERTA — Magnetus / Antidoto / Conteudo e Vendas', 'OFERTA', 'active', 'Produtos, paginas, funis, stories, criativos, DM e vendas.', 'organizacao', 'Classificar materiais e reaproveitar agente de neuromarketing.'),
('MAQUINA — Sol.IA Sistema Neural / Publisher / Tecnologia', 'MAQUINA', 'active', 'App, Supabase, GitHub, Vercel, APIs, Publisher e automacoes.', 'fundacao', 'Conectar app ao banco e validar memoria.'),
('ESTACIONAMENTO — Ideias futuras', 'ESTACIONAMENTO', 'active', 'Ideias boas que nao devem roubar foco agora.', 'ativo', 'Guardar sem executar.')
on conflict do nothing;

commit;
