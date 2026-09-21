-- Additive, private pilot jobs. Apply to isolated test/Preview database first.
begin;
create table if not exists public.solia_reference_jobs (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  input_hash text not null check (input_hash ~ '^[a-f0-9]{64}$'),
  revision integer not null default 0 check (revision >= 0),
  state jsonb not null check (jsonb_typeof(state) = 'object' and octet_length(state::text) <= 750000),
  lease_id uuid, lease_until timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  check ((lease_id is null) = (lease_until is null))
);
create index if not exists solia_reference_owner_time on public.solia_reference_jobs(owner_id, updated_at desc);
alter table public.solia_reference_jobs enable row level security;
revoke all on public.solia_reference_jobs from public, anon, authenticated;
grant select, insert, update, delete on public.solia_reference_jobs to authenticated;
drop policy if exists solia_reference_owner on public.solia_reference_jobs;
create policy solia_reference_owner on public.solia_reference_jobs to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create or replace function public.create_solia_reference_job(p_id uuid, p_input_hash text, p_state jsonb)
returns public.solia_reference_jobs language plpgsql security invoker set search_path = '' as $$
declare row public.solia_reference_jobs;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('reference:' || auth.uid()::text, 0));
  select * into row from public.solia_reference_jobs where id=p_id and owner_id=auth.uid();
  if found then
    if row.input_hash <> p_input_hash then raise exception 'idempotency_conflict' using errcode='40001'; end if;
    return row;
  end if;
  if (select count(*) from public.solia_reference_jobs where owner_id=auth.uid()) >= 30 then raise exception 'job_limit' using errcode='54000'; end if;
  insert into public.solia_reference_jobs(id,owner_id,input_hash,state) values(p_id,auth.uid(),p_input_hash,p_state) returning * into row;
  return row;
end $$;

create or replace function public.claim_solia_reference_job(p_id uuid, p_revision integer, p_token uuid)
returns public.solia_reference_jobs language plpgsql security invoker set search_path = '' as $$
declare row public.solia_reference_jobs;
begin
  if p_token is null then raise exception 'token_required' using errcode='22023'; end if;
  update public.solia_reference_jobs set lease_id=p_token, lease_until=clock_timestamp()+interval '120 seconds',
    revision=revision+1, updated_at=clock_timestamp()
    where id=p_id and owner_id=auth.uid() and revision=p_revision and lease_id is null returning * into row;
  if not found then raise exception 'revision_or_lease_conflict' using errcode='40001'; end if;
  return row;
end $$;

create or replace function public.save_solia_reference_job(p_id uuid, p_revision integer, p_token uuid, p_state jsonb)
returns public.solia_reference_jobs language plpgsql security invoker set search_path = '' as $$
declare row public.solia_reference_jobs;
begin
  update public.solia_reference_jobs set state=p_state, lease_id=null, lease_until=null, revision=revision+1, updated_at=clock_timestamp()
    where id=p_id and owner_id=auth.uid() and revision=p_revision and lease_id is not distinct from p_token returning * into row;
  if not found then raise exception 'revision_or_lease_conflict' using errcode='40001'; end if;
  return row;
end $$;

create or replace function public.recover_solia_reference_job(p_id uuid, p_revision integer)
returns public.solia_reference_jobs language plpgsql security invoker set search_path = '' as $$
declare row public.solia_reference_jobs;
begin
  update public.solia_reference_jobs set
    state=jsonb_set(jsonb_set(state,'{status}','"uncertain"'),'{lastError}',
      '{"code":"interrupted_operation","message":"Uma operação foi interrompida sem confirmação. Confira antes de repetir."}'::jsonb),
    lease_id=null,lease_until=null,revision=revision+1,updated_at=clock_timestamp()
    where id=p_id and owner_id=auth.uid() and revision=p_revision and lease_until < clock_timestamp() returning * into row;
  if not found then raise exception 'lease_active_or_revision_conflict' using errcode='40001'; end if;
  return row;
end $$;
revoke all on function public.create_solia_reference_job(uuid,text,jsonb) from public,anon;
revoke all on function public.claim_solia_reference_job(uuid,integer,uuid) from public,anon;
revoke all on function public.save_solia_reference_job(uuid,integer,uuid,jsonb) from public,anon;
revoke all on function public.recover_solia_reference_job(uuid,integer) from public,anon;
grant execute on function public.create_solia_reference_job(uuid,text,jsonb) to authenticated;
grant execute on function public.claim_solia_reference_job(uuid,integer,uuid) to authenticated;
grant execute on function public.save_solia_reference_job(uuid,integer,uuid,jsonb) to authenticated;
grant execute on function public.recover_solia_reference_job(uuid,integer) to authenticated;
commit;
