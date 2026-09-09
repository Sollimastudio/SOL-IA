\set ON_ERROR_STOP on
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$
declare first_import jsonb; repeated jsonb; second_import jsonb; old_repeat jsonb; total integer;
begin
  first_import:=public.import_solia_knowledge('morte-em-vida','capitulo.txt','Capítulo 1','CANARY_PRIVATE_A início da história de infância.',0);
  if (first_import->>'version')::integer<>1 then raise exception 'Initial version failed'; end if;
  repeated:=public.import_solia_knowledge('morte-em-vida','capitulo.txt','Capítulo 1','CANARY_PRIVATE_A início da história de infância.',0);
  if repeated->>'id'<>first_import->>'id' or not (repeated->>'duplicate')::boolean then raise exception 'Dedup failed'; end if;
  second_import:=public.import_solia_knowledge('morte-em-vida','capitulo.txt','Capítulo 1','CANARY_PRIVATE_A atualização da história de infância.',1);
  if (second_import->>'version')::integer<>2 then raise exception 'Revision failed'; end if;
  old_repeat:=public.import_solia_knowledge('morte-em-vida','capitulo.txt','Capítulo 1','CANARY_PRIVATE_A início da história de infância.',0);
  if (old_repeat->>'version')::integer<>1 or (old_repeat->>'latestVersion')::integer<>2 then raise exception 'Old retry replaced latest'; end if;
  select count(*) into total from public.solia_knowledge_documents;
  if total<>2 then raise exception 'Revision preservation failed'; end if;
  if exists(select 1 from public.search_solia_knowledge('história infância') where version<>2) then raise exception 'Superseded version leaked into default search'; end if;
  if not exists(select 1 from public.search_solia_knowledge('história infância')) then raise exception 'Lexical search failed'; end if;
  begin
    perform public.import_solia_knowledge('morte-em-vida','capitulo.txt','Capítulo 1','tentativa obsoleta',1);
    raise exception 'Missing conflict check';
  exception when serialization_failure then null; end;
  begin
    update public.solia_knowledge_documents set content='silently overwritten';
    raise exception 'Direct mutation unexpectedly allowed';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.solia_knowledge_documents;
    raise exception 'Direct deletion unexpectedly allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.import_solia_knowledge('unknown','x','X','Y',0);
    raise exception 'Unknown project accepted';
  exception when invalid_parameter_value then null; end;
end;
$$;
-- Exact reconstruction including non-ASCII characters and overlap boundaries.
do $$
declare original text := repeat('memória, infância e café. ',180); imported jsonb; reconstructed text;
begin
  imported:=public.import_solia_knowledge('reposicione-se','unicode.txt','Unicode',original,0);
  select string_agg(substring(c.content from 1 for 1800),'' order by c.start_char) into reconstructed
    from public.solia_knowledge_chunks c where c.document_id=(imported->>'id')::uuid;
  if reconstructed<>original then raise exception 'Chunk boundaries lost text'; end if;
  if exists(select 1 from public.solia_knowledge_chunks c where c.document_id=(imported->>'id')::uuid
    and substring(original from c.start_char for c.end_char-c.start_char+1)<>c.content) then raise exception 'Source locator mismatch'; end if;
end;
$$;
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$
begin
  if exists(select 1 from public.solia_knowledge_documents) or exists(select 1 from public.solia_knowledge_chunks) then raise exception 'RLS cross-account read'; end if;
  if exists(select 1 from public.search_solia_knowledge('infância café')) then raise exception 'Cross-account search'; end if;
  perform public.import_solia_knowledge('morte-em-vida','capitulo.txt','Mesmo nome, outra conta','CANARY_PRIVATE_B texto particular.',0);
  if (select count(*) from public.solia_knowledge_documents)<>1 then raise exception 'Account namespace collision'; end if;
end;
$$;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$ begin
  if exists(select 1 from public.solia_knowledge_documents where content like '%CANARY_PRIVATE_B%') then raise exception 'Foreign data visible'; end if;
end $$;
reset role;
set role anon;
set request.jwt.claim.sub='';
do $$ begin
  begin perform public.search_solia_knowledge('infância'); raise exception 'Anonymous search allowed';
  exception when insufficient_privilege then null; end;
  begin perform public.import_solia_knowledge('geral','x','X','Y',0); raise exception 'Anonymous import allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
-- Verify transactional quota under actual SQL, not a mocked API.
set role authenticated;
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$
declare n integer;
begin
  for n in 1..26 loop
    perform public.import_solia_knowledge('geral','quota-'||n::text,'Quota',repeat('x',160000),0);
  end loop;
  begin
    perform public.import_solia_knowledge('geral','quota-over','Quota',repeat('x',160000),0);
    raise exception 'Storage quota bypassed';
  exception when program_limit_exceeded then null; end;
end;
$$;
reset role;
select 'All database source/version/RLS assertions passed' as result;
