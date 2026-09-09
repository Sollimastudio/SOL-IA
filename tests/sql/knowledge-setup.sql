-- Isolated CI ONLY. Do not execute against a Supabase production project.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users(id uuid primary key);
insert into auth.users values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid;
$$;
grant usage on schema auth, public to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
