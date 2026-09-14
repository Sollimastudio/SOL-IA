begin;

alter table public.solia_continuity_events drop constraint if exists solia_continuity_events_scope_check;
alter table public.solia_continuity_events add constraint solia_continuity_events_scope_check
  check (scope in ('raw_statement','temporary_state','exploration','explicit_update','profile_statement'));

create table if not exists public.solia_profile_claims (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  memory_id uuid not null references public.solia_memories(id) on delete cascade,
  kind text not null check (kind in ('goal','boundary','preference','style','decision','correction')),
  topic_hint text not null default '' check (char_length(topic_hint) <= 160),
  content text not null,
  status text not null default 'active' check (status in ('active','superseded')),
  created_at timestamptz not null default now(),
  fts tsvector generated always as (to_tsvector('portuguese'::regconfig, content)) stored,
  unique(owner_id,memory_id)
);
create index if not exists solia_profile_claims_owner_created_idx on public.solia_profile_claims(owner_id,created_at desc);
create index if not exists solia_profile_claims_fts_idx on public.solia_profile_claims using gin(fts);
alter table public.solia_profile_claims enable row level security;
revoke all on table public.solia_profile_claims from anon,authenticated;

create or replace function public.record_solia_continuity_event(
  p_memory_id uuid,
  p_relation text,
  p_scope text,
  p_topic_hint text default '',
  p_delta_hint text default '',
  p_signals jsonb default '{}'::jsonb
)
returns table(id uuid, relation text, scope text, topic_hint text, delta_hint text, created_at timestamptz)
language plpgsql security definer set search_path=''
as $$
declare
  v_owner uuid := auth.uid();
  v_content text;
  v_kind text;
begin
  if v_owner is null then raise exception 'authentication required'; end if;
  if p_relation not in ('repeat','detail','correction','decision','branch','new_topic') then raise exception 'invalid relation'; end if;
  if p_scope not in ('raw_statement','temporary_state','exploration','explicit_update','profile_statement') then raise exception 'invalid scope'; end if;
  if char_length(coalesce(p_topic_hint,'')) > 160 or char_length(coalesce(p_delta_hint,'')) > 500 then raise exception 'continuity metadata too long'; end if;

  select m.content into v_content
  from public.solia_memories m
  where m.id=p_memory_id and m.owner_id=v_owner;
  if v_content is null then raise exception 'memory not found'; end if;

  insert into public.solia_continuity_events(owner_id,memory_id,relation,scope,topic_hint,delta_hint,signals,content)
  values(v_owner,p_memory_id,p_relation,p_scope,coalesce(p_topic_hint,''),coalesce(p_delta_hint,''),coalesce(p_signals,'{}'::jsonb),v_content)
  on conflict(owner_id,memory_id) do nothing;

  if p_scope in ('explicit_update','profile_statement') then
    v_kind := nullif(coalesce(p_signals->>'profileKind',''),'');
    if v_kind is null and p_relation='decision' then v_kind:='decision'; end if;
    if v_kind is null and p_relation='correction' then v_kind:='correction'; end if;
    if v_kind in ('goal','boundary','preference','style','decision','correction') then
      insert into public.solia_profile_claims(owner_id,memory_id,kind,topic_hint,content,created_at)
      select v_owner,p_memory_id,v_kind,coalesce(p_topic_hint,''),v_content,m.created_at
      from public.solia_memories m where m.id=p_memory_id and m.owner_id=v_owner
      on conflict(owner_id,memory_id) do nothing;
    end if;
  end if;

  return query
  select e.id,e.relation,e.scope,e.topic_hint,e.delta_hint,e.created_at
  from public.solia_continuity_events e
  where e.owner_id=v_owner and e.memory_id=p_memory_id
  limit 1;
end;$$;
revoke all on function public.record_solia_continuity_event(uuid,text,text,text,text,jsonb) from public,anon;
grant execute on function public.record_solia_continuity_event(uuid,text,text,text,text,jsonb) to authenticated;

create or replace function public.search_solia_profile_claims(p_query text,p_limit integer default 12)
returns table(id uuid,memory_id uuid,kind text,topic_hint text,content text,created_at timestamptz,match_kind text,score real)
language plpgsql security definer set search_path=''
as $$
declare
  v_owner uuid := auth.uid();
  v_limit integer := greatest(1,least(coalesce(p_limit,12),20));
  v_query tsquery;
begin
  if v_owner is null then return; end if;
  begin
    v_query := websearch_to_tsquery('portuguese'::regconfig,left(coalesce(p_query,''),1000));
  exception when others then
    v_query := null;
  end;

  return query
  with matched as (
    select p.id,p.memory_id,p.kind,p.topic_hint,p.content,p.created_at,'match'::text as match_kind,
      case when v_query is null then 0::real else ts_rank_cd(p.fts,v_query)::real end as score
    from public.solia_profile_claims p
    where p.owner_id=v_owner and p.status='active' and v_query is not null and p.fts @@ v_query
    order by 8 desc,p.created_at desc
    limit least(v_limit,8)
  ), recent as (
    select p.id,p.memory_id,p.kind,p.topic_hint,p.content,p.created_at,'recent'::text as match_kind,0::real as score
    from public.solia_profile_claims p
    where p.owner_id=v_owner and p.status='active' and not exists(select 1 from matched m where m.id=p.id)
    order by p.created_at desc
    limit v_limit
  )
  select * from (select * from matched union all select * from recent) all_rows
  limit v_limit;
end;$$;
revoke all on function public.search_solia_profile_claims(text,integer) from public,anon;
grant execute on function public.search_solia_profile_claims(text,integer) to authenticated;

create or replace function public.search_solia_continuity(p_query text,p_limit integer default 12)
returns table(id uuid,memory_id uuid,relation text,scope text,topic_hint text,delta_hint text,signals jsonb,content text,created_at timestamptz,match_kind text,score real)
language plpgsql security definer set search_path=''
as $$
declare
  v_owner uuid := auth.uid();
  v_limit integer := greatest(1,least(coalesce(p_limit,12),20));
  v_query tsquery;
begin
  if v_owner is null then return; end if;
  begin v_query := websearch_to_tsquery('portuguese'::regconfig,left(coalesce(p_query,''),1000)); exception when others then v_query:=null; end;
  return query with matched as (
    select e.id,e.memory_id,e.relation,e.scope,e.topic_hint,e.delta_hint,e.signals,e.content,e.created_at,'match'::text as match_kind,
      case when v_query is null then 0::real else ts_rank_cd(e.fts,v_query)::real end as score
    from public.solia_continuity_events e
    where e.owner_id=v_owner and v_query is not null and e.fts @@ v_query
    order by 11 desc,e.created_at desc limit least(v_limit,8)
  ), anchors as (
    select e.id,e.memory_id,e.relation,e.scope,e.topic_hint,e.delta_hint,e.signals,e.content,e.created_at,'anchor'::text as match_kind,0::real as score
    from public.solia_continuity_events e
    where e.owner_id=v_owner and e.scope in ('explicit_update','profile_statement')
      and not exists(select 1 from matched m where m.id=e.id)
    order by e.created_at desc limit least(v_limit,8)
  ), recent as (
    select e.id,e.memory_id,e.relation,e.scope,e.topic_hint,e.delta_hint,e.signals,e.content,e.created_at,'recent'::text as match_kind,0::real as score
    from public.solia_continuity_events e
    where e.owner_id=v_owner
      and not exists(select 1 from matched m where m.id=e.id)
      and not exists(select 1 from anchors a where a.id=e.id)
    order by e.created_at desc limit v_limit
  )
  select * from (select * from matched union all select * from anchors union all select * from recent) all_rows limit v_limit;
end;$$;
revoke all on function public.search_solia_continuity(text,integer) from public,anon;
grant execute on function public.search_solia_continuity(text,integer) to authenticated;

commit;
