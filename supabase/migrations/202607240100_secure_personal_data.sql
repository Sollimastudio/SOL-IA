-- Sol.IA — memoria privada por usuario
-- Execute no SQL Editor do Supabase antes de habilitar
-- VITE_SECURE_MEMORY_ENABLED=true.
--
-- Esta migracao:
-- 1. adiciona ownership a todas as tabelas pessoais;
-- 2. remove policies anteriores dessas tabelas;
-- 3. habilita RLS owner-only;
-- 4. bloqueia anonimos;
-- 5. cria auditoria automatica da memoria sem copiar o conteudo intimo.

begin;

create extension if not exists pgcrypto;

alter table public.core_facts
  add column if not exists owner_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.projects
  add column if not exists owner_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.memories
  add column if not exists owner_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.chapters
  add column if not exists owner_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.documents
  add column if not exists owner_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.decisions
  add column if not exists owner_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.artifacts
  add column if not exists owner_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.tasks
  add column if not exists owner_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.prompt_versions
  add column if not exists owner_id uuid references auth.users(id) on delete cascade default auth.uid();

alter table public.memories
  add column if not exists origin text not null default 'conversation';

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
create index if not exists idx_memories_owner_created on public.memories(owner_id, created_at desc);
create index if not exists idx_chapters_owner on public.chapters(owner_id);
create index if not exists idx_documents_owner on public.documents(owner_id);
create index if not exists idx_decisions_owner on public.decisions(owner_id);
create index if not exists idx_artifacts_owner on public.artifacts(owner_id);
create index if not exists idx_tasks_owner on public.tasks(owner_id);
create index if not exists idx_prompt_versions_owner on public.prompt_versions(owner_id);
create index if not exists idx_memory_audit_owner_performed
  on public.memory_audit_logs(owner_id, performed_at desc);
create index if not exists idx_memory_audit_memory
  on public.memory_audit_logs(memory_id, performed_at desc);

-- Qualquer policy permissiva anterior tornaria o isolamento ineficaz.
-- Removemos somente policies das tabelas pessoais listadas explicitamente.
do $$
declare
  table_name text;
  policy_row record;
begin
  foreach table_name in array array[
    'core_facts',
    'projects',
    'memories',
    'chapters',
    'documents',
    'decisions',
    'artifacts',
    'tasks',
    'prompt_versions',
    'memory_audit_logs'
  ]
  loop
    for policy_row in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
    loop
      execute format(
        'drop policy if exists %I on public.%I',
        policy_row.policyname,
        table_name
      );
    end loop;
  end loop;
end
$$;

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

-- Fatos bloqueados podem ser lidos pelo dono, mas nao alterados nem apagados
-- pela aplicacao. O SQL Editor continua sendo o caminho administrativo.
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

-- Policies owner-only para as demais tabelas pessoais.
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

-- Logs sao visiveis pelo dono, mas somente o trigger interno pode grava-los.
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
    audit_changes := jsonb_build_object(
      'type', old.type,
      'title', old.title
    );
  elsif tg_op = 'INSERT' then
    audit_owner := new.owner_id;
    audit_memory := new.id;
    audit_changes := jsonb_build_object(
      'type', new.type,
      'title', new.title,
      'tags', new.tags
    );
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

  -- Linhas legadas sem dono ficam invisiveis ate o script de reivindicacao.
  if audit_owner is not null then
    insert into public.memory_audit_logs (
      owner_id,
      memory_id,
      action,
      changes
    )
    values (
      audit_owner,
      audit_memory,
      lower(tg_op),
      audit_changes
    );
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$$;

revoke all on function public.audit_memory_change() from public;
revoke all on function public.audit_memory_change() from anon;
revoke all on function public.audit_memory_change() from authenticated;

drop trigger if exists memories_audit_trigger on public.memories;
create trigger memories_audit_trigger
after insert or update or delete on public.memories
for each row execute function public.audit_memory_change();

commit;
