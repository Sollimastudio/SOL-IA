begin;
create or replace function public.search_solia_continuity(p_query text, p_limit integer default 12)
returns table(id uuid,memory_id uuid,relation text,scope text,topic_hint text,delta_hint text,signals jsonb,content text,created_at timestamptz,match_kind text,score real)
language plpgsql security definer set search_path = '' as $$
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
    select e.id,e.memory_id,e.relation,e.scope,e.topic_hint,e.delta_hint,e.signals,e.content,e.created_at,
      'match'::text as match_kind,
      case when v_query is null then 0::real else ts_rank_cd(e.fts,v_query)::real end as score
    from public.solia_continuity_events e
    where e.owner_id=v_owner and v_query is not null and e.fts @@ v_query
    order by 11 desc,e.created_at desc
    limit least(v_limit,8)
  ), anchors as (
    select e.id,e.memory_id,e.relation,e.scope,e.topic_hint,e.delta_hint,e.signals,e.content,e.created_at,
      'anchor'::text as match_kind,0::real as score
    from public.solia_continuity_events e
    where e.owner_id=v_owner and e.scope='explicit_update'
      and not exists(select 1 from matched m where m.id=e.id)
    order by e.created_at desc
    limit least(v_limit,8)
  ), recent as (
    select e.id,e.memory_id,e.relation,e.scope,e.topic_hint,e.delta_hint,e.signals,e.content,e.created_at,
      'recent'::text as match_kind,0::real as score
    from public.solia_continuity_events e
    where e.owner_id=v_owner
      and not exists(select 1 from matched m where m.id=e.id)
      and not exists(select 1 from anchors a where a.id=e.id)
    order by e.created_at desc
    limit v_limit
  )
  select * from (
    select * from matched
    union all select * from anchors
    union all select * from recent
  ) all_rows
  limit v_limit;
end;$$;
revoke all on function public.search_solia_continuity(text,integer) from public,anon;
grant execute on function public.search_solia_continuity(text,integer) to authenticated;
commit;
