# Merchant CAD

API backend para cadastro e análise de merchants.

## Caminhos de execução

O projeto oferece dois caminhos para rodar a aplicação:

- **SQLite (local)** — recomendado para avaliação rápida. Nenhuma dependência
  externa além do Python.
- **PostgreSQL via Docker** — ambiente reproduzível com banco relacional.
  Requer Docker e Docker Compose.

A escolha do banco é definida por ambiente. Sem variáveis `POSTGRES_*`, o
Django usa SQLite. Com `POSTGRES_DB` configurada, usa PostgreSQL. Nenhuma regra
de negócio muda entre os bancos.

---

## SQLite (local)

### Configuração

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
```

### Execução

```bash
python manage.py runserver
```

### Testes

```bash
python manage.py test
```

---

## PostgreSQL via Docker

### Requisitos

- Docker
- Docker Compose

### Subir o ambiente

```bash
# Construir a imagem da aplicação
docker compose build

# Subir aplicação e banco de dados
docker compose up -d

# Rodar as migrations no PostgreSQL
docker compose run --rm app python manage.py migrate
```

A API fica disponível em `http://localhost:8000/`.

### Executar testes

```bash
docker compose run --rm app python manage.py test
```

### Acessar a API

```bash
# Listar merchants
curl http://localhost:8000/api/merchants/

# Criar um merchant
curl -X POST http://localhost:8000/api/merchants/ \
  -H "Content-Type: application/json" \
  -d '{"cnpj":"11.222.333/0001-81","legal_name":"Acme Pagamentos LTDA","contact_email":"ops@acme.example"}'
```

### Gerenciar os containers

```bash
# Parar os containers (dados persistem no volume)
docker compose down

# Parar e remover o volume de dados do PostgreSQL
docker compose down -v
```

### Observações

- O banco PostgreSQL persiste os dados em um volume nomeado (`postgres_data`).
- O serviço da aplicação só inicia após o PostgreSQL estar pronto (healthcheck).
- A escolha do banco é feita por ambiente: a configuração do Compose define as
  variáveis `POSTGRES_*` que ativam o PostgreSQL. Sem essas variáveis, o Django
  volta para SQLite automaticamente.

---

## Campos da API

A API usa nomes de campos em inglês:

```text
razão social    -> legal_name
nome fantasia   -> trade_name
e-mail contato  -> contact_email
telefone        -> phone
```

`cnpj`, `legal_name` e `contact_email` são obrigatórios. `trade_name` e `phone`
são opcionais.

## Endpoints da API

```text
POST /api/merchants/
GET  /api/merchants/
GET  /api/merchants/?status=draft
GET  /api/merchants/{id}/
PATCH /api/merchants/{id}/
POST /api/merchants/{id}/submit-for-analysis/
POST /api/merchants/{id}/approve/
POST /api/merchants/{id}/reject/
POST /api/merchants/{id}/block/
GET  /api/merchants/{id}/timeline/
```

Novos merchants começam com status `draft`. O CNPJ de entrada pode incluir
pontuação, mas é salvo apenas com dígitos. As respostas de listagem e detalhe
incluem apenas os campos públicos do Merchant, sem dados da timeline embutidos.

Dados cadastrais só podem ser atualizados enquanto o merchant está em `draft`.
O campo `status` é somente leitura nas operações comuns de criação e
atualização; mudanças de fluxo usam endpoints de ação explícitos.

`POST /api/merchants/{id}/submit-for-analysis/` move um merchant de `draft`
para `pending_analysis`, cria o primeiro evento da timeline com a mensagem
`Merchant enviado para análise` e retorna o merchant atualizado.

`POST /api/merchants/{id}/approve/` move um merchant de `pending_analysis`
para `approved`, cria um evento na timeline com a mensagem
`Merchant aprovado` e retorna o merchant atualizado.

`POST /api/merchants/{id}/reject/` aceita um payload com `reason` não vazio,
move um merchant de `pending_analysis` para `rejected`, cria um evento na
timeline com a mensagem `Merchant rejeitado: <motivo>` e retorna o merchant
atualizado. Rejeição sem `reason`, ou com `reason` vazio, retorna
`400 Bad Request`. Rejeição em status inválido retorna erro de negócio com
`422 Unprocessable Entity`.

`POST /api/merchants/{id}/block/` aceita um payload com `reason` não vazio,
move um merchant de `approved` para `blocked`, cria um evento na timeline com
a mensagem `Merchant bloqueado: <motivo>` e retorna o merchant atualizado.
Bloqueio sem `reason`, ou com `reason` vazio, retorna `400 Bad Request`.
Bloqueio em status inválido retorna erro de negócio com
`422 Unprocessable Entity`.

`GET /api/merchants/{id}/timeline/` retorna os eventos daquele merchant em
ordem cronológica.

## Decisões técnicas

- **Django + Django REST Framework** — escolha do ecossistema Django pela
  produtividade, ORM embutido e suporte a migrations, combinado com DRF para
  expor a API REST de forma consistente.
- **SQLite como banco padrão** — elimina dependência externa de banco de dados
  no caminho local; migrations funcionam com `python manage.py migrate` sem
  configurar PostgreSQL ou Docker.
- **PostgreSQL via Docker como opção** — ao definir `POSTGRES_DB` e variáveis
  relacionadas, a aplicação conecta em PostgreSQL; o ambiente containerizado
  demonstra maturidade operacional sem tornar Docker obrigatório.
- **Sem autenticação** — fora do escopo do desafio; a API não exige tokens,
  sessões nem permissões.
- **Status controlado por endpoints explícitos** — cada transição de status tem
  seu próprio endpoint (`submit-for-analysis`, `approve`, `reject`, `block`),
  validando regras de negócio e gerando eventos na timeline. O campo `status`
  é somente leitura nas operações comuns.
- **Timeline separada do Merchant** — eventos são armazenados em modelo próprio
  (`MerchantEvent`) e expostos em endpoint dedicado, mantendo o detalhe do
  Merchant simples.
- **CNPJ normalizado** — o valor enviado é limpo de pontuação e salvo apenas
  com dígitos, garantindo unicidade independente da formatação de entrada.
- **Camada de serviços** — regras de transição ficam em `services.py`,
  mantendo as views finas e as regras testáveis independentemente do contrato
  HTTP.
- **Transições inválidas retornam `422 Unprocessable Entity`** — separa erros
  de negócio de erros de validação de formulário (`400`).

Essas decisões estão documentadas em detalhe em `docs/ADRs/`.

---

## Frontend React

O frontend é uma SPA em React + Vite que consome a API REST de Merchants.

### Pré-requisitos

- Node.js 20+

### Execução local

```bash
cd frontend
npm install
npm run dev
```

O frontend fica disponível em `http://localhost:5173/`. O Vite faz proxy das
chamadas `/api/` para `http://localhost:8000/` (Django rodando localmente).

### Execução via Docker Compose

O frontend já está incluído no `docker-compose.yml`. Para subir tudo:

```bash
docker compose build
docker compose up -d
```

- Frontend: `http://localhost/` (servido por nginx na porta 80)
- API: `http://localhost:8000/api/merchants/`

### Testes unitários e de integração

```bash
cd frontend
npm test
```

### Testes E2E (Playwright)

```bash
# Requer backend rodando (local ou Docker)
cd frontend
npm run test:e2e
```

### Mapa de rotas

| Caminho | Página |
|---|---|
| `/merchants` | Lista de merchants com filtro por status |
| `/merchants/new` | Criar novo merchant |
| `/merchants/:id` | Detalhe do merchant + timeline + ações de transição |
| `/merchants/:id/edit` | Editar dados cadastrais (apenas em draft) |

---

## Fora do escopo inicial

- Autenticação e autorização.
- Validação formal de CNPJ (dígitos verificadores e tamanho exato).
- Integração com API pública de CNPJ (gov.br).
- Paginação, ordenação avançada e busca textual.
- Painel administrativo customizado do Django.
