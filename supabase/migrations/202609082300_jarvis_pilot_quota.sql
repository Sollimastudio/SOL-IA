-- ADDITIVE pilot migration. Apply in a test environment first.
-- No changes to legacy memory tables, policies or user content.
begin;
create table if not exists public.solia_jarvis_daily_usage (
  owner_id uuid not null references auth.users(id) on delete cascade,
  usage_day date not null,
  attempts integer not null check (attempts between 1 and 40),
  primary key (owner_id, usage_day)
);
alter table public.solia_jarvis_daily_usage enable row level security;
revoke all on public.solia_jarvis_daily_usage from anon, authenticated;
grant select on public.solia_jarvis_daily_usage to authenticated;
drop policy if exists solia_jarvis_usage_owner on public.solia_jarvis_daily_usage;
create policy solia_jarvis_usage_owner on public.solia_jarvis_daily_usage
  for select to authenticated using (auth.uid() = owner_id);

create or replace function public.reserve_solia_jarvis_turn()
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  today_utc date := (now() at time zone 'UTC')::date;
  reserved integer;
begin
  if actor is null then return false; end if;
  insert into public.solia_jarvis_daily_usage as usage (owner_id, usage_day, attempts)
    values (actor, today_utc, 1)
  on conflict (owner_id, usage_day) do update
    set attempts = usage.attempts + 1
    where usage.attempts < 40
  returning attempts into reserved;
  return reserved is not null;
end;
$$;
revoke all on function public.reserve_solia_jarvis_turn() from public, anon;
grant execute on function public.reserve_solia_jarvis_turn() to authenticated;
commit;
