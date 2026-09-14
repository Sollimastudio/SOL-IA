begin;

create table if not exists public.solia_continuity_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  memory_id uuid not null references public.solia_memories(id) on delete cascade,
  relation text not null check (relation in ('repeat','detail','correction','decision','branch','new_topic')),
  scope text not null check (scope in ('raw_statement','temporary_state','exploration','explicit_update')),
  topic_hint text not null default '' check (char_length(topic_hint) <= 160),
  delta_hint text not null default '' check (char_length(delta_hint) <= 500),
  signals jsonb not null default '{}'::jsonb,
  content text not null,
  created_at timestamptz not null default now(),
  fts tsvector generated always as (to_tsvector('portuguese'::regconfig, content)) stored,
  unique(owner_id, memory_id)
);

create index if not exists solia_continuity_owner_created_idx
  on public.solia_continuity_events(owner_id, created_at desc);
create index if not exists solia_continuity_fts_idx
  on public.solia_continuity_events using gin(fts);

alter table public.solia_continuity_events enable row level security;

drop policy if exists solia_continuity_select_own on public.solia_continuity_events;
create policy solia_continuity_select_own on public.solia_continuity_events
  for select to authenticated using (owner_id = auth.uid());

revoke all on table public.solia_continuity_events from anon, authenticated;
grant select on table public.solia_continuity_events to authenticated;

create or replace function public.record_solia_continuity_event(
  p_memory_id uuid,
  p_relation text,
  p_scope text,
  p_topic_hint text default '',
  p_delta_hint text default '',
  p_signals jsonb default '{}'::jsonb
)
returns table(id uuid, relation text, scope text, topic_hint text, delta_hint text, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_content text;
begin
  if v_owner is null then raise exception 'authentication required'; end if;
  if p_relation not in ('repeat','detail','correction','decision','branch','new_topic') then raise exception 'invalid relation'; end if;
  if p_scope not in ('raw_statement','temporary_state','exploration','explicit_update') then raise exception 'invalid scope'; end if;
  if char_length(coalesce(p_topic_hint,'')) > 160 or char_length(coalesce(p_delta_hint,'')) > 500 then raise exception 'continuity metadata too long'; end if;

  select m.content into v_content
  from public.solia_memories m
  where m.id = p_memory_id and m.owner_id = v_owner;
  if v_content is null then raise exception 'memory not found'; end if;

  insert into public.solia_continuity_events(owner_id, memory_id, relation, scope, topic_hint, delta_hint, signals, content)
  values(v_owner, p_memory_id, p_relation, p_scope, coalesce(p_topic_hint,''), coalesce(p_delta_hint,''), coalesce(p_signals,'{}'::jsonb), v_content)
  on conflict(owner_id, memory_id) do nothing;

  return query
  select e.id, e.relation, e.scope, e.topic_hint, e.delta_hint, e.created_at
  from public.solia_continuity_events e
  where e.owner_id = v_owner and e.memory_id = p_memory_id
  limit 1;
end;
$$;

revoke all on function public.record_solia_continuity_event(uuid,text,text,text,text,jsonb) from public, anon;
grant execute on function public.record_solia_continuity_event(uuid,text,text,text,text,jsonb) to authenticated;

create or replace function public.search_solia_continuity(p_query text, p_limit integer default 12)
returns table(
  id uuid,
  memory_id uuid,
  relation text,
  scope text,
  topic_hint text,
  delta_hint text,
  signals jsonb,
  content text,
  created_at timestamptz,
  match_kind text,
  score real
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_limit integer := greatest(1, least(coalesce(p_limit,12),20));
  v_query tsquery;
begin
  if v_owner is null then return; end if;
  begin
    v_query := websearch_to_tsquery('portuguese'::regconfig, left(coalesce(p_query,''),1000));
  exception when others then
    v_query := null;
  end;

  return query
  with matched as (
    select e.id, e.memory_id, e.relation, e.scope, e.topic_hint, e.delta_hint, e.signals, e.content, e.created_at,
      'match'::text as match_kind,
      case when v_query is null then 0::real else ts_rank_cd(e.fts, v_query)::real end as score
    from public.solia_continuity_events e
    where e.owner_id = v_owner and v_query is not null and e.fts @@ v_query
    order by score desc, e.created_at desc
    limit v_limit
  ), recent as (
    select e.id, e.memory_id, e.relation, e.scope, e.topic_hint, e.delta_hint, e.signals, e.content, e.created_at,
      'recent'::text as match_kind, 0::real as score
    from public.solia_continuity_events e
    where e.owner_id = v_owner and not exists(select 1 from matched m where m.id = e.id)
    order by e.created_at desc
    limit v_limit
  )
  select * from (
    select * from matched
    union all
    select * from recent
  ) x
  limit v_limit;
end;
$$;

revoke all on function public.search_solia_continuity(text,integer) from public, anon;
grant execute on function public.search_solia_continuity(text,integer) to authenticated;

commit;
