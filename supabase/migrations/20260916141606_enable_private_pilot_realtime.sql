alter table public.solia_pilot_users
  add column if not exists can_use_realtime boolean not null default false;

do $$
declare
  v_user_count integer;
  v_user_id uuid;
begin
  select count(*) into v_user_count from auth.users;
  select id into v_user_id from auth.users order by created_at asc limit 1;
  if v_user_count <> 1 or v_user_id is null then
    raise exception 'expected exactly one auth user';
  end if;

  update public.solia_pilot_users
  set can_use_realtime = true,
      updated_at = now()
  where owner_id = v_user_id;

  if not found then
    raise exception 'pilot membership row missing';
  end if;
end $$;
