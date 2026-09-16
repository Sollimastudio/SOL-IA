begin;

-- Browser Live authorization now uses the signed-in Supabase JWT to call a
-- server-only token broker. The broker mints Vercel single-use, short-lived
-- Live client secrets, so no custom bearer-ticket table or SECURITY DEFINER
-- RPC is necessary.
alter table public.solia_pilot_users
  add column if not exists can_use_realtime boolean not null default false;

commit;
