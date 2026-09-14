\set ON_ERROR_STOP on

insert into public.solia_memories(id,owner_id,type,title,content,tags,origin,metadata)
values
('abababab-abab-4aba-8aba-ababababab01','11111111-1111-4111-8111-111111111111','idea_capture','Pergunta teste','Explique novamente arquitetura.',array['jarvis'],'conversation','{}');

set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select * from public.record_solia_assistant_response(
 'abababab-abab-4aba-8aba-ababababab01',
 'A arquitetura ja foi explicada; avance apenas no que mudou.',
 'jarvis_executive','test-model','test-v1'
);

do $$ begin
  if (select count(*) from public.search_solia_assistant_history('arquitetura',8) where answer like '%ja foi explicada%') <> 1 then
    raise exception 'assistant history retrieval failed';
  end if;
  begin
    perform 1 from public.solia_assistant_history limit 1;
    raise exception 'direct assistant history access should be denied';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$ begin
  if exists(select 1 from public.search_solia_assistant_history('arquitetura',8) where answer like '%ja foi explicada%') then
    raise exception 'assistant history cross-owner leak';
  end if;
end $$;
reset role;
