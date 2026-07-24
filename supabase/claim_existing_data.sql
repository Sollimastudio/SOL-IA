-- Sol.IA — reivindicar dados legados
--
-- PRE-REQUISITOS:
-- 1. Entre uma vez no aplicativo com seu email para criar o usuario em auth.users.
-- 2. No Supabase, abra Authentication > Users e copie o UUID correto.
-- 3. Substitua o UUID zero abaixo.
-- 4. Execute este arquivo no SQL Editor.
--
-- O script recusa UUID inexistente e so reivindica linhas ainda sem dono.

begin;

do $$
declare
  target_user uuid := '00000000-0000-0000-0000-000000000000';
begin
  if target_user = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'Substitua target_user pelo UUID real de Authentication > Users.';
  end if;

  if not exists (select 1 from auth.users where id = target_user) then
    raise exception 'O UUID informado nao existe em auth.users.';
  end if;

  update public.core_facts set owner_id = target_user where owner_id is null;
  update public.projects set owner_id = target_user where owner_id is null;
  update public.memories set owner_id = target_user where owner_id is null;
  update public.chapters set owner_id = target_user where owner_id is null;
  update public.documents set owner_id = target_user where owner_id is null;
  update public.decisions set owner_id = target_user where owner_id is null;
  update public.artifacts set owner_id = target_user where owner_id is null;
  update public.tasks set owner_id = target_user where owner_id is null;
  update public.prompt_versions set owner_id = target_user where owner_id is null;
end
$$;

commit;

-- Verificacao: todas as contagens devem ser zero antes da ativacao.
select 'core_facts' as table_name, count(*) as rows_without_owner
  from public.core_facts where owner_id is null
union all
select 'projects', count(*) from public.projects where owner_id is null
union all
select 'memories', count(*) from public.memories where owner_id is null
union all
select 'chapters', count(*) from public.chapters where owner_id is null
union all
select 'documents', count(*) from public.documents where owner_id is null
union all
select 'decisions', count(*) from public.decisions where owner_id is null
union all
select 'artifacts', count(*) from public.artifacts where owner_id is null
union all
select 'tasks', count(*) from public.tasks where owner_id is null
union all
select 'prompt_versions', count(*) from public.prompt_versions where owner_id is null;
