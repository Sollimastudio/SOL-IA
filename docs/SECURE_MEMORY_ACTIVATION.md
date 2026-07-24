# Ativacao da memoria segura

O codigo de autenticacao e memoria fica bloqueado por padrao. Isso evita gravar
dados pessoais antes de o banco aplicar isolamento por usuario.

## Ordem obrigatoria

1. No Supabase SQL Editor, execute
   `supabase/migrations/202607240100_secure_personal_data.sql`.
2. Em Authentication > URL Configuration:
   - confirme a URL principal da Sol.IA;
   - adicione as URLs de preview que serao usadas no teste.
3. Habilite Email OTP / Magic Link no Supabase Auth.
4. Configure na Vercel, em Production e Preview:
   - `VITE_SUPABASE_URL`;
   - `VITE_SUPABASE_ANON_KEY`.
5. Entre uma vez no aplicativo para criar o usuario em `auth.users`.
6. Copie o UUID desse usuario em Authentication > Users.
7. Substitua o UUID zero e execute `supabase/claim_existing_data.sql`.
8. Confirme que o relatorio final mostra `rows_without_owner = 0` em todas as tabelas.
9. Somente agora defina `VITE_SECURE_MEMORY_ENABLED=true` na Vercel e faca um novo deploy.

## Testes obrigatorios antes da producao

- Sem login, a consulta `memories` deve retornar zero linhas ou erro de permissao.
- Com o Usuario A, devem aparecer apenas linhas cujo `owner_id` seja o Usuario A.
- Se houver Usuario B de teste, ele nao pode ler, alterar ou excluir dados do Usuario A.
- Uma nova captura deve gerar uma linha em `memory_audit_logs`.
- O log de auditoria nao deve copiar o texto completo da memoria.
- O navegador nunca deve receber `service_role`.

## Rollback seguro

Se a validacao falhar, mantenha `VITE_SECURE_MEMORY_ENABLED=false`. Nao desabilite
RLS para fazer o aplicativo funcionar. Corrija a policy ou a atribuicao de
`owner_id` e repita os testes.
