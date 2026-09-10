-- Private pilot membership for Jarvis. Additive and isolated from legacy tables.
begin;
create table if not exists public.solia_pilot_users (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  can_use_ai boolean not null default false,
  model text not null default 'openai/gpt-5.6-sol' check (char_length(model) between 3 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.solia_pilot_users enable row level security;
revoke all on public.solia_pilot_users from anon, authenticated;
grant select on public.solia_pilot_users to authenticated;
drop policy if exists solia_pilot_self_select on public.solia_pilot_users;
create policy solia_pilot_self_select on public.solia_pilot_users
  for select to authenticated using (auth.uid() = owner_id);

-- This project currently has one Auth account. Bootstrap only when that remains true.
insert into public.solia_pilot_users(owner_id)
select u.id from auth.users u
where (select count(*) from auth.users) = 1
on conflict (owner_id) do nothing;
commit;
