begin;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['ativos','historico','memoria','projetos','quiz_events'] loop
    if pg_catalog.to_regclass(pg_catalog.format('public.%I', table_name)) is not null then
      execute pg_catalog.format('alter table public.%I enable row level security', table_name);
      execute pg_catalog.format('revoke all privileges on table public.%I from public, anon, authenticated', table_name);
    end if;
  end loop;
end
$$;

commit;
