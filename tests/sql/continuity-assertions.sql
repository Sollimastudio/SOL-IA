\set ON_ERROR_STOP on
insert into public.solia_memories(id,owner_id,type,title,content,tags,origin,metadata)
values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','11111111-1111-4111-8111-111111111111','idea_capture','Teste continuidade','Quero um Jarvis que guarde tudo e nao me faca repetir.',array['jarvis'],'conversation','{}'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','22222222-2222-4222-8222-222222222222','idea_capture','Outro dono','SEGREDO OUTRA CONTA',array['jarvis'],'conversation','{}');

set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select * from public.record_solia_continuity_event('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','new_topic','raw_statement','jarvis memoria','guarde repetir','{"heuristic":true}');

do $$ begin
  if (select count(*) from public.search_solia_continuity('guardar repetir',12)) <> 1 then raise exception 'owner search failed'; end if;
  if exists(select 1 from public.solia_continuity_events where content like '%SEGREDO%') then raise exception 'cross owner leak'; end if;
end $$;

reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$ begin
  if exists(select 1 from public.search_solia_continuity('guardar repetir',12) where content like '%Jarvis%') then raise exception 'RLS leak'; end if;
end $$;
reset role;
