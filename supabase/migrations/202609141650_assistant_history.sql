begin;

create table if not exists public.solia_assistant_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  memory_id uuid not null references public.solia_memories(id) on delete cascade,
  answer text not null check (char_length(answer) between 1 and 16000),
  specialist text not null default '' check (char_length(specialist) <= 80),
  model text not null default '' check (char_length(model) <= 120),
  prompt_version text not null default '' check (char_length(prompt_version) <= 80),
  created_at timestamptz not null default now(),
  fts tsvector generated always as (to_tsvector('portuguese'::regconfig, answer)) stored,
  unique(owner_id,memory_id)
);
create index if not exists solia_assistant_history_owner_created_idx on public.solia_assistant_history(owner_id,created_at desc);
create index if not exists solia_assistant_history_fts_idx on public.solia_assistant_history using gin(fts);
alter table public.solia_assistant_history enable row level security;
revoke all on table public.solia_assistant_history from anon,authenticated;

create or replace function public.record_solia_assistant_response(
  p_memory_id uuid,
  p_answer text,
  p_specialist text default '',
  p_model text default '',
  p_prompt_version text default ''
)
returns table(id uuid,created_at timestamptz)
language plpgsql security definer set search_path=''
as $$
declare v_owner uuid:=auth.uid();
begin
  if v_owner is null then raise exception 'authentication required'; end if;
  if char_length(coalesce(p_answer,''))<1 or char_length(p_answer)>16000 then raise exception 'invalid answer'; end if;
  if char_length(coalesce(p_specialist,''))>80 or char_length(coalesce(p_model,''))>120 or char_length(coalesce(p_prompt_version,''))>80 then raise exception 'metadata too long'; end if;
  if not exists(select 1 from public.solia_memories m where m.id=p_memory_id and m.owner_id=v_owner) then raise exception 'memory not found'; end if;

  insert into public.solia_assistant_history(owner_id,memory_id,answer,specialist,model,prompt_version)
  values(v_owner,p_memory_id,p_answer,coalesce(p_specialist,''),coalesce(p_model,''),coalesce(p_prompt_version,''))
  on conflict(owner_id,memory_id) do nothing;

  return query select h.id,h.created_at from public.solia_assistant_history h where h.owner_id=v_owner and h.memory_id=p_memory_id limit 1;
end;$$;
revoke all on function public.record_solia_assistant_response(uuid,text,text,text,text) from public,anon;
grant execute on function public.record_solia_assistant_response(uuid,text,text,text,text) to authenticated;

create or replace function public.search_solia_assistant_history(p_query text,p_limit integer default 8)
returns table(id uuid,memory_id uuid,answer text,specialist text,model text,prompt_version text,created_at timestamptz,match_kind text,score real)
language plpgsql security definer set search_path=''
as $$
declare v_owner uuid:=auth.uid(); v_limit integer:=greatest(1,least(coalesce(p_limit,8),20)); v_query tsquery;
begin
  if v_owner is null then return; end if;
  begin v_query:=websearch_to_tsquery('portuguese'::regconfig,left(coalesce(p_query,''),1000)); exception when others then v_query:=null; end;
  return query with matched as (
    select h.id,h.memory_id,h.answer,h.specialist,h.model,h.prompt_version,h.created_at,'match'::text as match_kind,
      case when v_query is null then 0::real else ts_rank_cd(h.fts,v_query)::real end as score
    from public.solia_assistant_history h
    where h.owner_id=v_owner and v_query is not null and h.fts@@v_query
    order by 9 desc,h.created_at desc limit least(v_limit,6)
  ), recent as (
    select h.id,h.memory_id,h.answer,h.specialist,h.model,h.prompt_version,h.created_at,'recent'::text as match_kind,0::real as score
    from public.solia_assistant_history h
    where h.owner_id=v_owner and not exists(select 1 from matched m where m.id=h.id)
    order by h.created_at desc limit v_limit
  )
  select * from (select * from matched union all select * from recent) all_rows limit v_limit;
end;$$;
revoke all on function public.search_solia_assistant_history(text,integer) from public,anon;
grant execute on function public.search_solia_assistant_history(text,integer) to authenticated;

commit;
