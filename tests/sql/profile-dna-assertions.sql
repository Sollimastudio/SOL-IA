\set ON_ERROR_STOP on

insert into public.solia_memories(id,owner_id,type,title,content,tags,origin,metadata)
values
('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','11111111-1111-4111-8111-111111111111','idea_capture','Meta perfil','Meu objetivo e construir uma comunidade paga forte.',array['jarvis'],'conversation','{}'),
('dddddddd-dddd-4ddd-8ddd-ddddddddddd1','11111111-1111-4111-8111-111111111111','idea_capture','Estado passageiro','Hoje estou sem energia.',array['jarvis'],'conversation','{}');

set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select * from public.record_solia_continuity_event(
  'cccccccc-cccc-4ccc-8ccc-ccccccccccc1','new_topic','profile_statement','objetivo comunidade','comunidade paga',
  '{"heuristic":true,"profileMarker":true,"profileKind":"goal"}'::jsonb
);
select * from public.record_solia_continuity_event(
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd1','new_topic','temporary_state','estado hoje','sem energia',
  '{"heuristic":true,"temporaryStateMarker":true,"profileKind":null}'::jsonb
);

do $$ begin
  if (select count(*) from public.search_solia_profile_claims('comunidade',12) where kind='goal') <> 1 then
    raise exception 'profile goal retrieval failed';
  end if;
  if exists(select 1 from public.search_solia_profile_claims('energia',12) where content like '%sem energia%') then
    raise exception 'temporary state leaked into profile';
  end if;
  begin
    perform 1 from public.solia_profile_claims limit 1;
    raise exception 'direct profile table access should be denied';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$ begin
  if exists(select 1 from public.search_solia_profile_claims('comunidade',12) where content like '%comunidade paga%') then
    raise exception 'profile cross-owner leak';
  end if;
end $$;
reset role;
