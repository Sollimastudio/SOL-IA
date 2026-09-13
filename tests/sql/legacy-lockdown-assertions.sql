-- Isolated CI ONLY. Creates disposable legacy fixtures and proves the lockdown
-- removes application access without deleting the existing row.

create table public.ativos(id integer primary key, note text);
create table public.historico(id integer primary key, note text);
create table public.memoria(id integer primary key, note text);
create table public.projetos(id integer primary key, note text);
create table public.quiz_events(id integer primary key, note text);

grant all privileges on table public.ativos, public.historico, public.memoria, public.projetos, public.quiz_events to anon, authenticated;
insert into public.memoria(id, note) values (1, 'preserve-me');

do $$
declare
  table_name text;
begin
  foreach table_name in array array['ativos','historico','memoria','projetos','quiz_events'] loop
    if not pg_catalog.has_table_privilege('anon', pg_catalog.format('public.%I', table_name), 'SELECT') then
      raise exception 'fixture did not expose % to anon before migration', table_name;
    end if;
    if not pg_catalog.has_table_privilege('authenticated', pg_catalog.format('public.%I', table_name), 'UPDATE') then
      raise exception 'fixture did not expose % to authenticated before migration', table_name;
    end if;
  end loop;
end
$$;

\ir ../../supabase/migrations/202609132303_lock_legacy_public_tables.sql
-- A second application must be harmless for replayed migrations / fresh setup checks.
\ir ../../supabase/migrations/202609132303_lock_legacy_public_tables.sql

do $$
declare
  table_name text;
  has_rls boolean;
  preserved integer;
begin
  foreach table_name in array array['ativos','historico','memoria','projetos','quiz_events'] loop
    select c.relrowsecurity into has_rls
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = table_name and c.relkind = 'r';
    if has_rls is distinct from true then
      raise exception 'RLS not enabled for %', table_name;
    end if;
    if pg_catalog.has_table_privilege('anon', pg_catalog.format('public.%I', table_name), 'SELECT')
       or pg_catalog.has_table_privilege('anon', pg_catalog.format('public.%I', table_name), 'INSERT')
       or pg_catalog.has_table_privilege('authenticated', pg_catalog.format('public.%I', table_name), 'SELECT')
       or pg_catalog.has_table_privilege('authenticated', pg_catalog.format('public.%I', table_name), 'UPDATE') then
      raise exception 'application grant survived for %', table_name;
    end if;
  end loop;

  select count(*) into preserved from public.memoria where id = 1 and note = 'preserve-me';
  if preserved <> 1 then
    raise exception 'legacy row was deleted or changed';
  end if;
end
$$;
