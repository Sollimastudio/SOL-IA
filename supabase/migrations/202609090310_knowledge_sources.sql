-- Additive, private, append-only source library. Test before enabling the feature.
-- No legacy memory, Auth or Meta Ads table is changed.
begin;
create table if not exists public.solia_knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null check (project_key in ('morte-em-vida','reposicione-se','fuga-identitaria','feminicidio-emocional','eu-nao-desapareco','marca-e-negocios','pessoal','geral')),
  source_key text not null check (source_key ~ '^[a-z0-9][a-z0-9._-]{0,119}$'),
  title text not null check (char_length(title) between 1 and 160),
  content text not null check (octet_length(content) between 1 and 160000),
  version integer not null check (version > 0),
  checksum text not null,
  status text not null default 'imported_unverified' check (status = 'imported_unverified'),
  created_at timestamptz not null default now(),
  unique (owner_id, project_key, source_key, version),
  unique (owner_id, project_key, source_key, checksum),
  unique (id, owner_id)
);
create table if not exists public.solia_knowledge_chunks (
  document_id uuid not null,
  owner_id uuid not null,
  start_char integer not null check (start_char > 0),
  end_char integer not null check (end_char >= start_char),
  content text not null,
  fts tsvector generated always as (to_tsvector('portuguese', content)) stored,
  primary key (document_id, start_char),
  foreign key (document_id, owner_id) references public.solia_knowledge_documents(id, owner_id) on delete cascade
);
create index if not exists solia_knowledge_owner on public.solia_knowledge_documents(owner_id, project_key, source_key, version desc);
create index if not exists solia_chunks_owner on public.solia_knowledge_chunks(owner_id);
create index if not exists solia_chunks_search on public.solia_knowledge_chunks using gin(fts);
alter table public.solia_knowledge_documents enable row level security;
alter table public.solia_knowledge_chunks enable row level security;
revoke all on public.solia_knowledge_documents, public.solia_knowledge_chunks from anon, authenticated;
grant select on public.solia_knowledge_documents, public.solia_knowledge_chunks to authenticated;
drop policy if exists solia_documents_owner on public.solia_knowledge_documents;
create policy solia_documents_owner on public.solia_knowledge_documents for select to authenticated using (auth.uid() = owner_id);
drop policy if exists solia_chunks_owner on public.solia_knowledge_chunks;
create policy solia_chunks_owner on public.solia_knowledge_chunks for select to authenticated using (auth.uid() = owner_id);

create or replace function public.import_solia_knowledge(
  p_project text, p_source text, p_title text, p_content text, p_expected_version integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid(); latest integer; same public.solia_knowledge_documents%rowtype;
  new_id uuid; digest text; size_used bigint; revisions bigint;
begin
  if actor is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_project is null or p_project not in ('morte-em-vida','reposicione-se','fuga-identitaria','feminicidio-emocional','eu-nao-desapareco','marca-e-negocios','pessoal','geral')
    or p_source is null or p_source !~ '^[a-z0-9][a-z0-9._-]{0,119}$'
    or p_title is null or char_length(btrim(p_title)) not between 1 and 160
    or p_content is null or char_length(btrim(p_content)) = 0 or octet_length(p_content) > 160000
    or p_expected_version is null or p_expected_version < 0 or p_expected_version > 200 then
    raise exception 'Invalid source' using errcode = '22023';
  end if;
  -- Serialize ALL imports by this account: version checks and total byte quotas stay atomic.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('solia-knowledge:' || actor::text, 0));
  digest := pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_array(p_title,p_content)::text,'UTF8')),'hex');
  select coalesce(max(d.version),0) into latest from public.solia_knowledge_documents d
    where d.owner_id=actor and d.project_key=p_project and d.source_key=p_source;
  select * into same from public.solia_knowledge_documents d where d.owner_id=actor and d.project_key=p_project and d.source_key=p_source and d.checksum=digest;
  if found then
    return pg_catalog.jsonb_build_object('id',same.id,'version',same.version,'latestVersion',latest,'duplicate',true);
  end if;
  if latest <> p_expected_version then raise exception 'Version conflict' using errcode='40001'; end if;
  select coalesce(sum(octet_length(d.content)),0),count(*) into size_used,revisions from public.solia_knowledge_documents d where d.owner_id=actor;
  if size_used + octet_length(p_content) > 4194304 or revisions >= 200 then raise exception 'Pilot storage quota' using errcode='54000'; end if;
  insert into public.solia_knowledge_documents(owner_id,project_key,source_key,title,content,version,checksum)
    values(actor,p_project,p_source,p_title,p_content,latest+1,digest) returning id into new_id;
  insert into public.solia_knowledge_chunks(document_id,owner_id,start_char,end_char,content)
    select new_id,actor,n,least(n+1999,char_length(p_content)),substring(p_content from n for 2000)
    from pg_catalog.generate_series(1,char_length(p_content),1800) n;
  return pg_catalog.jsonb_build_object('id',new_id,'version',latest+1,'latestVersion',latest+1,'duplicate',false);
end;
$$;
revoke all on function public.import_solia_knowledge(text,text,text,text,integer) from public,anon;
grant execute on function public.import_solia_knowledge(text,text,text,text,integer) to authenticated;

-- Indexed lexical search across ALL imported sources, not semantic embeddings.
-- Latest imported version only; older versions remain addressable in the library.
create or replace function public.search_solia_knowledge(p_query text)
returns table(id uuid,owner_id uuid,project_key text,title text,version integer,checksum text,start_char integer,end_char integer,content text)
language sql stable security invoker set search_path = '' as $$
  with terms as (
    select lex from unnest(tsvector_to_array(to_tsvector('portuguese',left(coalesce(p_query,''),500)))) lex limit 16
  ), query as (
    select to_tsquery('portuguese',string_agg(quote_literal(lex),' | ')) q from terms
  )
  select d.id,d.owner_id,d.project_key,d.title,d.version,d.checksum,c.start_char,c.end_char,c.content
  from public.solia_knowledge_chunks c
  join public.solia_knowledge_documents d on d.id=c.document_id and d.owner_id=c.owner_id
  cross join query
  where d.owner_id=auth.uid() and c.owner_id=auth.uid() and c.fts @@ query.q
    and not exists (select 1 from public.solia_knowledge_documents newer where newer.owner_id=d.owner_id and newer.project_key=d.project_key and newer.source_key=d.source_key and newer.version>d.version)
  order by ts_rank(c.fts,query.q) desc,d.created_at desc,c.start_char limit 6;
$$;
revoke all on function public.search_solia_knowledge(text) from public,anon;
grant execute on function public.search_solia_knowledge(text) to authenticated;
commit;
