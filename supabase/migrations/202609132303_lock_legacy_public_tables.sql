begin;

-- These legacy tables predate per-user ownership. Keep their rows intact, but
-- remove application access until an explicit ownership migration exists.
alter table public.ativos enable row level security;
alter table public.historico enable row level security;
alter table public.memoria enable row level security;
alter table public.projetos enable row level security;
alter table public.quiz_events enable row level security;

revoke all privileges on table public.ativos from public, anon, authenticated;
revoke all privileges on table public.historico from public, anon, authenticated;
revoke all privileges on table public.memoria from public, anon, authenticated;
revoke all privileges on table public.projetos from public, anon, authenticated;
revoke all privileges on table public.quiz_events from public, anon, authenticated;

commit;
