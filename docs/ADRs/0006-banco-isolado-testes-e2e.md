# Banco isolado para testes E2E

Status: Aceito

Os testes E2E com Playwright criam merchants na API real e os dados
permanecem no banco de desenvolvimento, poluindo a interface. Para isolar
os testes, toda execução do Playwright levanta um servidor Django com banco
próprio definido pela variável de ambiente `DB_NAME`.

## Decisão

Adicionamos `DB_NAME` à função `database_config()` em `settings.py`.
Quando presente, substitui o nome do banco tanto no SQLite (`db.sqlite3`)
quanto no PostgreSQL (`POSTGRES_DB`), sem alterar o comportamento padrão.

No `playwright.config.ts`, o servidor Django é gerenciado como um
`webServer` adicional:
1. Roda `python manage.py migrate` com `DB_NAME=e2e_db` para criar as
   tabelas no banco isolado.
2. Sobe `python manage.py runserver` na porta 8001 com `DB_NAME=e2e_db`.

O servidor Vite também é gerenciado pelo Playwright com a variável
`API_TARGET=http://localhost:8001`, fazendo o proxy de `/api` para o
Django de teste em vez do dev (porta 8000). O `vite.config.ts` lê
`API_TARGET` (default `http://localhost:8000`), mantendo o fluxo de
dev inalterado.

O Playwright gerencia o ciclo de vida — inicia antes dos testes e finaliza
ao término.

## Motivação

- Dados de teste não devem poluir o banco de desenvolvimento.
- A solução precisa funcionar com SQLite e PostgreSQL sem condicionais.
- Gerenciar o servidor Django pelo Playwright é consistente com o padrão
  já existente para o Vite.
- `DB_NAME` só é lido quando explicitamente definido — zero impacto no
  fluxo de desenvolvimento padrão.

## Consequências

- `npm run test:e2e` exige porta 8001 livre para o Django e 5173 para o
  Vite (ambos gerenciados pelo Playwright). A porta 8000 fica livre para
  um servidor Django de dev simultâneo.
- `e2e_db.sqlite3` (ou o nome definido via `DB_NAME` para SQLite) não é
  versionado — `.gitignore` atualizado.
- A suíte de testes backend (`APITestCase`) continua inalterada — o test
  runner do Django já cria e destrói um banco isolado automaticamente.
