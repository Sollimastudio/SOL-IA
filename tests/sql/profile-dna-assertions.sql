\set ON_ERROR_STOP on

insert into public.solia_memories(id,owner_id,type,title,content,tags,origin,metadata)
values
('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','11111111-1111-4111-8111-111111111111','idea_capture','Meta perfil','Meu objetivo e construir uma comunidade paga forte.',array['jarvis'],'conversation','{}'),
('dddddddd-dddd-4ddd-8ddd-ddddddddddd1','11111111-1111-4111-8111-111111111111','idea_capture','Estado passageiro','Hoje estou sem energia.',array['jarvis'],'conversation','{}'),
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1','11111111-1111-4111-8111-111111111111','idea_capture','Correcao de meta','Corrigindo: meu objetivo agora e construir uma comunidade pequena e qualificada.',array['jarvis'],'conversation','{}');

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

do $$
declare
  v_prior_event uuid;
begin
  if (select count(*) from public.search_solia_profile_claims('comunidade',12) where kind='goal') <> 1 then
    raise exception 'profile goal retrieval failed';
  end if;
  if exists(select 1 from public.search_solia_profile_claims('energia',12) where content like '%sem energia%') then
    raise exception 'temporary state leaked into profile';
  end if;

  select id into v_prior_event
  from public.search_solia_continuity('comunidade paga',12)
  where memory_id='cccccccc-cccc-4ccc-8ccc-ccccccccccc1'
  limit 1;
  if v_prior_event is null then raise exception 'prior profile event not found'; end if;

  perform * from public.record_solia_continuity_event(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1','correction','explicit_update','objetivo comunidade','pequena qualificada',
    jsonb_build_object('heuristic',true,'profileMarker',true,'profileKind','correction','priorEventId',v_prior_event::text)
  );

  if exists(select 1 from public.search_solia_profile_claims('comunidade paga forte',12) where memory_id='cccccccc-cccc-4ccc-8ccc-ccccccccccc1') then
    raise exception 'superseded profile claim leaked into active retrieval';
  end if;
  if (select count(*) from public.search_solia_profile_claims('comunidade pequena qualificada',12) where memory_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1' and kind='goal') <> 1 then
    raise exception 'corrected profile claim was not promoted with prior kind';
  end if;

  begin
    perform 1 from public.solia_profile_claims limit 1;
    raise exception 'direct profile table access should be denied';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

do $$
declare
  v_old uuid;
  v_new uuid;
  v_old_status text;
  v_old_next uuid;
  v_new_previous uuid;
begin
  select id,status,superseded_by_id into v_old,v_old_status,v_old_next
  from public.solia_profile_claims
  where owner_id='11111111-1111-4111-8111-111111111111' and memory_id='cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
  select id,supersedes_id into v_new,v_new_previous
  from public.solia_profile_claims
  where owner_id='11111111-1111-4111-8111-111111111111' and memory_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1';
  if v_old_status <> 'superseded' then raise exception 'old claim was not marked superseded'; end if;
  if v_old_next is distinct from v_new then raise exception 'old claim does not point to replacement'; end if;
  if v_new_previous is distinct from v_old then raise exception 'new claim does not point to prior version'; end if;
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$ begin
  if exists(select 1 from public.search_solia_profile_claims('comunidade',12) where content like '%comunidade%') then
    raise exception 'profile cross-owner leak';
  end if;
end $$;
reset role;
