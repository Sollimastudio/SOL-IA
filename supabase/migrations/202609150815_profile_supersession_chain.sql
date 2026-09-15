begin;

alter table public.solia_profile_claims
  add column if not exists supersedes_id uuid references public.solia_profile_claims(id) on delete set null,
  add column if not exists superseded_by_id uuid references public.solia_profile_claims(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists solia_profile_claims_supersedes_idx
  on public.solia_profile_claims(owner_id, supersedes_id)
  where supersedes_id is not null;
create index if not exists solia_profile_claims_superseded_by_idx
  on public.solia_profile_claims(owner_id, superseded_by_id)
  where superseded_by_id is not null;

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
  v_prior_event uuid;
  v_prior_claim uuid;
  v_prior_kind text;
  v_new_claim uuid;
  v_prior_raw text;
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

    if p_relation='correction' then
      v_prior_raw := nullif(coalesce(p_signals->>'priorEventId',''),'');
      if v_prior_raw is not null and v_prior_raw ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
        v_prior_event := v_prior_raw::uuid;
        select pc.id, pc.kind into v_prior_claim, v_prior_kind
        from public.solia_profile_claims pc
        join public.solia_continuity_events ce
          on ce.owner_id=pc.owner_id and ce.memory_id=pc.memory_id
        where ce.id=v_prior_event
          and ce.owner_id=v_owner
          and pc.owner_id=v_owner
          and pc.status='active'
        order by pc.created_at desc
        limit 1;
        if v_prior_claim is not null and v_prior_kind is not null then
          v_kind := v_prior_kind;
        end if;
      end if;
    end if;

    if v_kind in ('goal','boundary','preference','style','decision','correction') then
      insert into public.solia_profile_claims(owner_id,memory_id,kind,topic_hint,content,created_at,supersedes_id)
      select v_owner,p_memory_id,v_kind,coalesce(p_topic_hint,''),v_content,m.created_at,v_prior_claim
      from public.solia_memories m where m.id=p_memory_id and m.owner_id=v_owner
      on conflict(owner_id,memory_id) do nothing
      returning public.solia_profile_claims.id into v_new_claim;

      if v_new_claim is null then
        select pc.id into v_new_claim
        from public.solia_profile_claims pc
        where pc.owner_id=v_owner and pc.memory_id=p_memory_id
        limit 1;
      end if;

      if p_relation='correction' and v_prior_claim is not null and v_new_claim is not null and v_prior_claim <> v_new_claim then
        update public.solia_profile_claims pc
        set status='superseded', superseded_by_id=v_new_claim, updated_at=now()
        where pc.id=v_prior_claim and pc.owner_id=v_owner and pc.status='active';
      end if;
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

commit;
