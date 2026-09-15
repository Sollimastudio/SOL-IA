begin;

alter table public.solia_pilot_users
  add column if not exists can_use_realtime boolean not null default false;

create table if not exists public.solia_realtime_tickets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  ticket_hash bytea not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists solia_realtime_tickets_expiry_idx
  on public.solia_realtime_tickets(expires_at)
  where used_at is null;

alter table public.solia_realtime_tickets enable row level security;
revoke all on table public.solia_realtime_tickets from public, anon, authenticated;

create or replace function public.create_solia_realtime_ticket(p_ttl_seconds integer default 30)
returns table(ticket text, ticket_expires_at timestamptz)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_owner uuid := auth.uid();
  v_raw text;
  v_expires timestamptz;
begin
  if v_owner is null then raise exception 'authentication required'; end if;
  if p_ttl_seconds < 10 or p_ttl_seconds > 60 then raise exception 'invalid realtime ticket ttl'; end if;
  if not exists(
    select 1 from public.solia_pilot_users p
    where p.owner_id=v_owner and p.can_use_ai=true and p.can_use_realtime=true
  ) then raise exception 'realtime not authorized'; end if;

  -- 256 bits of random material from two PostgreSQL core UUID generators.
  -- The database stores only a 128-bit one-way digest. Tickets expire in <=60s
  -- and are single-use, so no raw bearer capability is retained at rest.
  v_raw := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
  v_expires := now() + make_interval(secs => p_ttl_seconds);
  insert into public.solia_realtime_tickets(owner_id,ticket_hash,expires_at)
  values(v_owner,decode(md5(v_raw),'hex'),v_expires);

  return query select v_raw,v_expires;
end;$$;

create or replace function public.consume_solia_realtime_ticket(p_ticket text)
returns table(ticket_owner_id uuid, ticket_expires_at timestamptz)
language plpgsql
security definer
set search_path=''
as $$
begin
  if p_ticket is null or p_ticket !~ '^[0-9a-f]{64}$' then return; end if;

  return query
  update public.solia_realtime_tickets t
  set used_at=now()
  from public.solia_pilot_users p
  where t.ticket_hash=decode(md5(p_ticket),'hex')
    and t.used_at is null
    and t.expires_at>now()
    and p.owner_id=t.owner_id
    and p.can_use_ai=true
    and p.can_use_realtime=true
  returning t.owner_id,t.expires_at;
end;$$;

revoke all on function public.create_solia_realtime_ticket(integer) from public,anon;
grant execute on function public.create_solia_realtime_ticket(integer) to authenticated;
revoke all on function public.consume_solia_realtime_ticket(text) from public;
grant execute on function public.consume_solia_realtime_ticket(text) to anon,authenticated;

commit;