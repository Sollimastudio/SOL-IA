create table if not exists public.solia_source_connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('github','google_drive','vercel','n8n','instagram','facebook','tiktok','youtube','whatsapp_business')),
  external_id text not null,
  label text not null,
  auth_mode text not null check (auth_mode in ('github_oidc','oauth','webhook','bridge')),
  status text not null default 'pending' check (status in ('pending','connected','disabled','error','bridge')),
  sync_enabled boolean not null default false,
  permissions jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, provider, external_id)
);

alter table public.solia_source_connections enable row level security;

revoke all on public.solia_source_connections from public, anon;
grant select, insert, update, delete on public.solia_source_connections to authenticated;

create policy "source_connections_owner_select"
  on public.solia_source_connections for select
  to authenticated
  using (owner_id = auth.uid());

create policy "source_connections_owner_insert"
  on public.solia_source_connections for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "source_connections_owner_update"
  on public.solia_source_connections for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "source_connections_owner_delete"
  on public.solia_source_connections for delete
  to authenticated
  using (owner_id = auth.uid());

create or replace function public.sync_solia_knowledge_source(
  p_owner uuid,
  p_project text,
  p_source text,
  p_title text,
  p_content text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  latest integer;
  same public.solia_knowledge_documents%rowtype;
  new_id uuid;
  digest text;
  size_used bigint;
  revisions bigint;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  if p_owner is null
    or p_project is null or p_project not in ('morte-em-vida','reposicione-se','fuga-identitaria','feminicidio-emocional','eu-nao-desapareco','marca-e-negocios','pessoal','geral')
    or p_source is null or p_source !~ '^[a-z0-9][a-z0-9._-]{0,119}$'
    or p_title is null or char_length(btrim(p_title)) not between 1 and 160
    or p_content is null or char_length(btrim(p_content)) = 0 or octet_length(p_content) > 160000 then
    raise exception 'Invalid source' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('solia-source-sync:' || p_owner::text, 0));
  digest := pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_array(p_title,p_content)::text,'UTF8')),'hex');

  select coalesce(max(d.version),0) into latest
  from public.solia_knowledge_documents d
  where d.owner_id = p_owner and d.project_key = p_project and d.source_key = p_source;

  select * into same
  from public.solia_knowledge_documents d
  where d.owner_id = p_owner and d.project_key = p_project and d.source_key = p_source and d.checksum = digest
  order by d.version desc limit 1;

  if found then
    return pg_catalog.jsonb_build_object('id',same.id,'version',same.version,'latestVersion',latest,'duplicate',true);
  end if;

  select coalesce(sum(octet_length(d.content)),0), count(*)
    into size_used, revisions
  from public.solia_knowledge_documents d
  where d.owner_id = p_owner;

  if size_used + octet_length(p_content) > 4194304 or revisions >= 500 then
    raise exception 'Pilot storage quota' using errcode = '54000';
  end if;

  insert into public.solia_knowledge_documents(owner_id,project_key,source_key,title,content,version,checksum)
  values(p_owner,p_project,p_source,p_title,p_content,latest+1,digest)
  returning id into new_id;

  insert into public.solia_knowledge_chunks(document_id,owner_id,start_char,end_char,content)
  select new_id,p_owner,n,least(n+1999,char_length(p_content)),substring(p_content from n for 2000)
  from pg_catalog.generate_series(1,char_length(p_content),1800) n;

  return pg_catalog.jsonb_build_object('id',new_id,'version',latest+1,'latestVersion',latest+1,'duplicate',false);
end;
$function$;

revoke all on function public.sync_solia_knowledge_source(uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.sync_solia_knowledge_source(uuid,text,text,text,text) to service_role;

insert into public.solia_source_connections(owner_id, provider, external_id, label, auth_mode, status, sync_enabled, permissions, metadata)
select d.owner_id,
       'github',
       'Sollimastudio/trilogia-sol-lima',
       'Trilogia Sol Lima',
       'github_oidc',
       'connected',
       true,
       '{"read":"canonical_markdown","write":false}'::jsonb,
       '{"branch":"main","mode":"automatic_knowledge_sync"}'::jsonb
from public.solia_knowledge_documents d
where d.source_key in ('github-trilogia-start-here.md','github-trilogia-mapa-geral.md')
order by d.created_at asc
limit 1
on conflict (owner_id, provider, external_id) do update
set label = excluded.label,
    auth_mode = excluded.auth_mode,
    status = excluded.status,
    sync_enabled = excluded.sync_enabled,
    permissions = excluded.permissions,
    metadata = excluded.metadata,
    updated_at = now();
