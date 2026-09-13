-- Disposable CI database ONLY; uses the existing vault migration and rolls back fixtures.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
insert into public.solia_memories(id,type,content,metadata) values
  ('33333333-3333-4333-8333-333333333333','idea_capture',E'  Ideia fictícia\noriginal.  ','{"source":"jarvis-capture-v1","status":"raw_user_statement"}');
do $$ begin
  begin
    insert into public.solia_memories(id,type,content) values
      ('33333333-3333-4333-8333-333333333333','idea_capture','Não deve sobrescrever');
    raise exception 'duplicate capture was accepted';
  exception when unique_violation then null; end;
  if (select content from public.solia_memories where id='33333333-3333-4333-8333-333333333333') <> E'  Ideia fictícia\noriginal.  ' then
    raise exception 'original content changed';
  end if;
  if (select count(*) from public.solia_memory_audit_logs where memory_id='33333333-3333-4333-8333-333333333333') <> 1 then
    raise exception 'audit receipt missing or duplicated';
  end if;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$ begin
  if exists(select 1 from public.solia_memories where id='33333333-3333-4333-8333-333333333333') then
    raise exception 'another account can read capture';
  end if;
  if exists(select 1 from public.solia_memory_audit_logs where memory_id='33333333-3333-4333-8333-333333333333') then
    raise exception 'another account can read audit';
  end if;
  begin
    insert into public.solia_memories(owner_id,type,content) values
      ('11111111-1111-4111-8111-111111111111','idea_capture','Outra conta');
    raise exception 'another account can write capture';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'capture original, uniqueness, audit and RLS passed' as result;
