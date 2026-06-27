# Merchant CAD

API para cadastro e análise de Merchants desenvolvida como solução para o desafio técnico da Beeteller. O sistema gerencia o ciclo de vida de um merchant — desde o rascunho até aprovação, rejeição ou bloqueio — com histórico completo de eventos (timeline).

**Stack:** Python · Django · Django REST Framework · React · TypeScript · Docker · PostgreSQL / SQLite

---

## Checklist do desafio

| Requisito | Status |
|---|---|
| Projeto Django funcional com DRF | ✅ |
| Migrations versionadas | ✅ |
| Serializers e ViewSets | ✅ |
| Validações de regra de negócio | ✅ |
| Testes automatizados (backend + frontend + E2E) | ✅ |
| README com instruções de execução | ✅ |
| Explicação de decisões técnicas e trade-offs | ✅ |
| Código limpo e separação de camadas | ✅ |
| **Bônus:** Docker + Docker Compose | ✅ |
| **Bônus:** Frontend em React/TypeScript | ✅ |

---

## Como executar

O projeto suporta dois caminhos. Sem variáveis `POSTGRES_*` no ambiente, o Django usa SQLite automaticamente. Com elas definidas (como no Compose), usa PostgreSQL.

### Opção 1 — Docker Compose (recomendado)

Sobe PostgreSQL, API Django (via Gunicorn) e Frontend React em um único comando.

**Pré-requisitos:** Docker e Docker Compose instalados.

```bash
docker compose up -d --build
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost/ |
| API | http://localhost:8000/api/merchants/ |

### Opção 2 — Local com SQLite

Ideal para avaliação rápida sem dependências externas.

**Backend:**

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Frontend disponível em `http://localhost:5173/`.

---

## Testes

```bash
# Backend (local)
python manage.py test

# Backend (Docker)
docker compose run --rm app python manage.py test

# Frontend — unitários e integração
cd frontend && npm test

# Frontend — E2E com Playwright (requer backend rodando)
cd frontend && npm run test:e2e
```

---

## Endpoints da API

### CRUD e listagem

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/merchants/` | Cadastrar merchant |
| `GET` | `/api/merchants/` | Listar (aceita `?status=draft` e paginação) |
| `GET` | `/api/merchants/{id}/` | Consultar por ID |
| `PATCH` | `/api/merchants/{id}/` | Atualizar dados (apenas em `draft`) |

A listagem retorna resposta paginada. Parâmetros disponíveis: `status`, `page`, `page_size` (padrão `20`, máximo `100`).

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/merchants/?page=2",
  "previous": null,
  "results": []
}
```

### Transições de status

Cada mudança de estado tem seu próprio endpoint. Tentativas de transição inválida retornam `422 Unprocessable Entity`.

| Método | Rota | Transição | Payload obrigatório |
|---|---|---|---|
| `POST` | `…/{id}/submit-for-analysis/` | `draft` → `pending_analysis` | — |
| `POST` | `…/{id}/approve/` | `pending_analysis` → `approved` | — |
| `POST` | `…/{id}/reject/` | `pending_analysis` → `rejected` | `reason` |
| `POST` | `…/{id}/block/` | `approved` → `blocked` | `reason` |
| `POST` | `…/{id}/reopen/` | `rejected` → `draft` | `reason` |
| `POST` | `…/{id}/unblock/` | `blocked` → `approved` | `reason` |

> **Nota sobre `reopen` e `unblock`:** o spec define quatro transições. Foram adicionadas `reopen` e `unblock` para evitar estados terminais no ciclo de vida do merchant — sem essas operações, um merchant rejeitado ou bloqueado jamais poderia ser reprocessado. Ambas são extensões deliberadas além do escopo original.

### Timeline

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `…/{id}/timeline/` | Histórico de eventos em ordem cronológica |

---

## Campos da API

Nomes em inglês conforme convenção REST:

| Spec | API | Obrigatório |
|---|---|---|
| CNPJ | `cnpj` | ✅ (único) |
| Razão social | `legal_name` | ✅ |
| E-mail de contato | `contact_email` | ✅ |
| Nome fantasia | `trade_name` | — |
| Telefone | `phone` | — |
| Data de criação | `created_at` | automático |
| Status | `status` | automático (`draft`) |

**Sobre o CNPJ:** a entrada pode incluir pontuação (`11.222.333/0001-81`), que é removida antes do armazenamento, garantindo unicidade independente do formato enviado. A validação cobre tanto o formato numérico clássico (14 dígitos) quanto o formato alfanumérico introduzido pela Receita Federal na Instrução Normativa RFB 2.229/2024. Entradas que não respeitam nenhum dos dois formatos retornam `400 Bad Request`.

**Sobre o telefone:** aceita apenas dígitos, com 10 (fixo) ou 11 (móvel) caracteres. Entradas com letras, pontuação ou tamanho fora do padrão retornam `400 Bad Request`. O valor é salvo exatamente como recebido, sem normalização.

---

## Modelo de dados e regras de negócio

### Fluxo de status

```
draft ──────────────────► pending_analysis
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
                approved               rejected
                    │                       │
                    ▼                       ▼ (reopen)
                blocked ◄──────────      draft
                    │ (unblock)
                    ▼
                approved
```

### Mensagens da timeline

As mensagens seguem estritamente o padrão do enunciado:

| Evento | Mensagem |
|---|---|
| Envio para análise | `Merchant enviado para análise` |
| Aprovação | `Merchant aprovado` |
| Rejeição | `Merchant rejeitado: <motivo>` |
| Bloqueio | `Merchant bloqueado: <motivo>` |
| Desbloqueio | `Merchant desbloqueado: <motivo>` |
| Reabertura | `Merchant reaberto: <motivo>` |

### Regras de negócio aplicadas

- CNPJ, razão social e e-mail são obrigatórios no cadastro.
- CNPJ deve ser único na base.
- CNPJ é validado nos dois formatos aceitos pela Receita Federal: numérico (14 dígitos) e alfanumérico (IN RFB 2.229/2024).
- Dados cadastrais só podem ser alterados enquanto o merchant está em `draft`.
- Cada transição de status valida o estado atual antes de prosseguir.
- Rejeição e bloqueio exigem `reason` não vazio (retorna `400` se ausente).
- O campo `status` é somente leitura nas operações comuns (`POST`/`PATCH`).

---

## Decisões técnicas e trade-offs

Documentadas em detalhe nos [ADRs](docs/ADRs/).

### 1. Camada de serviços (`services.py`)

As regras de transição e geração de eventos ficam em `services.py`, mantendo as views finas (responsáveis apenas pelo contrato HTTP). Isso torna as regras de negócio testáveis de forma independente e reutilizáveis fora do contexto HTTP.

**Trade-off:** adiciona uma camada de indireção, mas elimina a tentação de colocar lógica de domínio nos serializers ou nas views.

### 2. Endpoints de ação explícitos para transições

Em vez de aceitar `PATCH /merchants/{id}/ {"status": "approved"}`, cada transição tem seu próprio endpoint. O campo `status` é marcado como `read_only` no serializer.

**Trade-off:** mais endpoints, mas transições inválidas são impossíveis de expressar acidentalmente — o cliente deve chamar a ação certa, e a validação de estado fica centralizada no serviço.

### 3. `MerchantEvent` como modelo separado

Eventos da timeline são armazenados em tabela própria com chave estrangeira para `Merchant`.

**Trade-off:** exige uma query extra para buscar a timeline, mas mantém o modelo `Merchant` enxuto e permite que o histórico cresça indefinidamente sem afetar a performance de leituras do merchant.

### 4. Códigos HTTP diferenciados: 400 vs 422

- `400 Bad Request` → dados mal formados (campo obrigatório ausente, formato inválido).
- `422 Unprocessable Entity` → operação sintaticamente válida, mas proibida pelo fluxo de negócio (ex: aprovar um merchant em `draft`).

Isso permite ao cliente da API distinguir programaticamente entre "corrija os dados" e "operação não permitida no estado atual".

### 5. Banco de dados dual (SQLite / PostgreSQL)

A configuração detecta automaticamente as variáveis `POSTGRES_*`. Sem elas, usa SQLite (zero dependências externas, ideal para avaliação). Com elas definidas (como no Docker Compose), usa PostgreSQL.

**Trade-off:** SQLite não suporta algumas features avançadas (ex: `FOR UPDATE SKIP LOCKED`), mas nenhuma regra de negócio deste projeto depende delas.

### 6. Gunicorn em produção (via Docker)

O container de produção usa Gunicorn com múltiplos workers em vez do `runserver` de desenvolvimento. O `runserver` é single-threaded e não suporta concorrência real.

---

## Estrutura do projeto

```
.
├── merchant_cad/        # Configurações do projeto Django
├── merchants/           # App Django principal
│   ├── migrations/      # Migrations do banco de dados
│   ├── models.py        # Merchant e MerchantEvent
│   ├── serializers.py   # Validação e serialização DRF
│   ├── services.py      # Regras de negócio e transições de estado
│   ├── viewsets.py      # Endpoints da API
│   └── tests/           # Testes automatizados do backend
├── frontend/            # Aplicação React (Vite + TypeScript)
│   ├── src/             # Componentes, páginas e hooks
│   └── e2e/             # Testes End-to-End com Playwright
├── docs/
│   └── ADRs/            # Architecture Decision Records
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── README.md
```

---

## Fora do escopo

- **Autenticação e autorização** — não solicitado.
- **Integração com API pública de CNPJ** (Receita Federal / gov.br).
- **Busca textual, ordenação avançada e filtros combinados**.
- **Painel administrativo customizado do Django**.
