-- Disposable PostgreSQL CI only. Proves capability tickets without calling any model.
insert into public.solia_pilot_users(owner_id,can_use_ai,can_use_realtime,model)
values
 ('11111111-1111-4111-8111-111111111111',true,true,'test/realtime'),
 ('22222222-2222-4222-8222-222222222222',true,false,'test/realtime')
on conflict(owner_id) do update set
 can_use_ai=excluded.can_use_ai,
 can_use_realtime=excluded.can_use_realtime,
 model=excluded.model;

select 1 / case when not has_table_privilege('authenticated','public.solia_realtime_tickets','select') then 1 else 0 end;
select 1 / case when has_function_privilege('authenticated','public.create_solia_realtime_ticket(integer)','execute') then 1 else 0 end;
select 1 / case when not has_function_privilege('anon','public.create_solia_realtime_ticket(integer)','execute') then 1 else 0 end;
select 1 / case when has_function_privilege('anon','public.consume_solia_realtime_ticket(text)','execute') then 1 else 0 end;

select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
set role authenticated;
select ticket,ticket_expires_at from public.create_solia_realtime_ticket(30) \gset rt_
reset role;

select 1 / case when length(:'rt_ticket')=64 and :'rt_ticket' ~ '^[0-9a-f]{64}$' then 1 else 0 end;
select 1 / case when (select count(*) from public.solia_realtime_tickets)=1 then 1 else 0 end;

set role anon;
select count(*) as count from public.consume_solia_realtime_ticket(:'rt_ticket') \gset first_
select count(*) as count from public.consume_solia_realtime_ticket(:'rt_ticket') \gset second_
reset role;
select 1 / case when :'first_count'::integer=1 then 1 else 0 end;
select 1 / case when :'second_count'::integer=0 then 1 else 0 end;

do $$
declare blocked boolean := false;
begin
  perform set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
  begin
    perform * from public.create_solia_realtime_ticket(30);
  exception when others then
    blocked := true;
  end;
  if not blocked then raise exception 'realtime ticket was created for unauthorized pilot'; end if;
end $$;

select 'realtime ticket permission, one-use consumption and isolation passed' as result;
