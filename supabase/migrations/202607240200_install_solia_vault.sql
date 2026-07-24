-- Sol.IA — cofre privado isolado das tabelas legadas
-- Seguro para executar mais de uma vez.
-- Nao altera nem exclui as tabelas antigas deste projeto.

begin;

create extension if not exists pgcrypto;

create table if not exists public.solia_memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  project_id uuid,
  type text not null,
  title text,
  content text not null,
  tags text[] not null default '{}',
  origin text not null default 'conversation',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.solia_memory_audit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  memory_id uuid not null,
  action text not null check (action in ('create', 'update', 'delete')),
  changes jsonb not null default '{}'::jsonb,
  performed_at timestamptz not null default now()
);

create index if not exists idx_solia_memories_owner_created
  on public.solia_memories(owner_id, created_at desc);
create index if not exists idx_solia_memories_owner_type
  on public.solia_memories(owner_id, type);
create index if not exists idx_solia_memories_tags
  on public.solia_memories using gin(tags);
create index if not exists idx_solia_audit_owner_performed
  on public.solia_memory_audit_logs(owner_id, performed_at desc);
create index if not exists idx_solia_audit_memory
  on public.solia_memory_audit_logs(memory_id, performed_at desc);

alter table public.solia_memories enable row level security;
alter table public.solia_memory_audit_logs enable row level security;

drop policy if exists solia_memories_owner_select
  on public.solia_memories;
drop policy if exists solia_memories_owner_insert
  on public.solia_memories;
drop policy if exists solia_memories_owner_update
  on public.solia_memories;
drop policy if exists solia_memories_owner_delete
  on public.solia_memories;
drop policy if exists solia_audit_owner_select
  on public.solia_memory_audit_logs;

create policy solia_memories_owner_select
  on public.solia_memories for select
  to authenticated
  using (auth.uid() is not null and auth.uid() = owner_id);

create policy solia_memories_owner_insert
  on public.solia_memories for insert
  to authenticated
  with check (auth.uid() is not null and auth.uid() = owner_id);

create policy solia_memories_owner_update
  on public.solia_memories for update
  to authenticated
  using (auth.uid() is not null and auth.uid() = owner_id)
  with check (auth.uid() is not null and auth.uid() = owner_id);

create policy solia_memories_owner_delete
  on public.solia_memories for delete
  to authenticated
  using (auth.uid() is not null and auth.uid() = owner_id);

create policy solia_audit_owner_select
  on public.solia_memory_audit_logs for select
  to authenticated
  using (auth.uid() is not null and auth.uid() = owner_id);

revoke all on table public.solia_memories from anon;
revoke all on table public.solia_memory_audit_logs from anon;
grant select, insert, update, delete
  on table public.solia_memories to authenticated;
revoke all on table public.solia_memory_audit_logs from authenticated;
grant select on table public.solia_memory_audit_logs to authenticated;

create or replace function public.set_solia_memory_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create or replace function public.audit_solia_memory_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  audit_owner uuid;
  audit_memory uuid;
  audit_action text;
  audit_changes jsonb;
begin
  if tg_op = 'DELETE' then
    audit_owner := old.owner_id;
    audit_memory := old.id;
    audit_action := 'delete';
    audit_changes := jsonb_build_object(
      'type', old.type,
      'title', old.title
    );
  elsif tg_op = 'INSERT' then
    audit_owner := new.owner_id;
    audit_memory := new.id;
    audit_action := 'create';
    audit_changes := jsonb_build_object(
      'type', new.type,
      'title', new.title,
      'tags', new.tags
    );
  else
    audit_owner := new.owner_id;
    audit_memory := new.id;
    audit_action := 'update';
    audit_changes := jsonb_build_object(
      'content_changed', new.content is distinct from old.content,
      'title_changed', new.title is distinct from old.title,
      'tags_changed', new.tags is distinct from old.tags,
      'metadata_changed', new.metadata is distinct from old.metadata
    );
  end if;

  insert into public.solia_memory_audit_logs (
    owner_id,
    memory_id,
    action,
    changes
  )
  values (
    audit_owner,
    audit_memory,
    audit_action,
    audit_changes
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$$;

revoke all on function public.set_solia_memory_updated_at() from public;
revoke all on function public.audit_solia_memory_change() from public;
revoke all on function public.audit_solia_memory_change() from anon;
revoke all on function public.audit_solia_memory_change() from authenticated;

drop trigger if exists solia_memories_updated_at
  on public.solia_memories;
create trigger solia_memories_updated_at
before update on public.solia_memories
for each row execute function public.set_solia_memory_updated_at();

drop trigger if exists solia_memories_audit
  on public.solia_memories;
create trigger solia_memories_audit
after insert or update or delete on public.solia_memories
for each row execute function public.audit_solia_memory_change();

commit;

select
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('solia_memories', 'solia_memory_audit_logs')
order by tablename;
