# Sol.IA — Sistema Neural

## Projeto-mae: Eu Nao Desapareco

A Sol.IA e o nucleo oficial de continuidade pessoal, editorial, estrategica e
tecnologica da Sol Lima. Ela recebe pensamento bruto, escolhe o especialista
certo e transforma a entrada em uma entrega utilizavel.

## Estado atual

- Jarvis com roteamento automatico;
- memoria inspirada no JARVIS-SOL, agora com autenticacao;
- RLS owner-only para dados pessoais;
- auditoria automatica sem copiar o texto intimo;
- Publisher, Narrativas e Video incorporados como fontes somente leitura;
- Meta Ads por endpoint `GET` autenticado, sem rotas de escrita;
- ativacao da memoria bloqueada ate a migracao segura ser validada.

## Regra de seguranca

Uma tela de login nao protege o banco sozinha. A protecao real e feita por:

1. Supabase Auth;
2. `owner_id` em cada tabela pessoal;
3. Row Level Security com `auth.uid() = owner_id`;
4. token Meta apenas no servidor;
5. feature flag desligada ate a migracao terminar.

Nunca configure `service_role` ou `META_ACCESS_TOKEN` com prefixo `VITE_`.

## Desenvolvimento

```bash
npm install
npm test
npm run build
```

Copie `.env.example` para `.env.local` e preencha somente o ambiente local.

## Ativacao

Siga, na ordem, [docs/SECURE_MEMORY_ACTIVATION.md](docs/SECURE_MEMORY_ACTIVATION.md).
As fronteiras das integracoes estao em
[docs/READ_ONLY_INTEGRATIONS.md](docs/READ_ONLY_INTEGRATIONS.md).

## Caixas oficiais

- OBRA
- METODO
- OFERTA
- MAQUINA
- ESTACIONAMENTO

## Fato intocavel 001

Sol nasceu no mesmo dia em que Oripe morreu. Oripe era o irmao unico da mae.
Nunca perguntar que idade Sol tinha quando Oripe morreu; ela estava nascendo.
