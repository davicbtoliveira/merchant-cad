# Merchant CAD

API para cadastro e análise de Merchants, desenvolvida como solução para o desafio técnico da Beeteller. O sistema gerencia o ciclo de vida de um merchant, desde o rascunho até a aprovação ou rejeição, mantendo um histórico completo de eventos (timeline).

O projeto foi desenvolvido utilizando **Python/Django** com **Django REST Framework (DRF)** no backend e **React/TypeScript** no frontend, com suporte a **Docker** para facilitar o deploy e a reprodução do ambiente.

---

## 📋 Checklist do Desafio

Este projeto foi desenhado para atender a todos os **requisitos técnicos** e **critérios de avaliação** exigidos no teste:

- [x] **Projeto Django funcional** com Django REST Framework (DRF).
- [x] **Modelagem e Migrations** para versionamento do banco de dados.
- [x] **Serializers e ViewSets** para exposição da API REST.
- [x] **Validações de regra de negócio** (transições de estado, campos obrigatórios, unicidade de CNPJ).
- [x] **Testes automatizados** (Backend com `unittest`, Frontend com Vitest e Playwright para E2E).
- [x] **README** com instruções claras para execução.
- [x] **Explicação das decisões técnicas e Trade-offs** (detalhados abaixo).
- [x] **Código limpo** e maturidade geral (Separação de camadas, ADRs).
- [x] **Bônus**: Implementação com Docker e Frontend em React.

---

## 🚀 Como Executar

O projeto oferece duas formas de execução: via Docker Compose (recomendado) ou localmente.

### Opção 1: Docker Compose (Recomendado)
Sobe o banco de dados PostgreSQL, a API Django e o Frontend React de uma só vez.

**Pré-requisitos:** Docker e Docker Compose instalados.

```bash
# Construir e subir os containers
docker compose up -d --build

# Executar as migrations no banco PostgreSQL
docker compose run --rm app python manage.py migrate
```

- **Frontend:** `http://localhost/`
- **API:** `http://localhost:8000/api/merchants/`

### Opção 2: Execução Local
Ideal para avaliação rápida sem Docker (usará SQLite por padrão).

#### Backend (Django)
```bash
# Criar e ativar ambiente virtual
python -m venv .venv
source .venv/bin/activate  # No Windows: .venv\Scripts\activate

# Instalar dependências e aplicar migrations
pip install -r requirements.txt
python manage.py migrate

# Rodar o servidor
python manage.py runserver
```

#### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
O frontend estará disponível em `http://localhost:5173/`.

---

## 🧪 Testes Automatizados

A suíte de testes garante a integridade das regras de negócio e a usabilidade da interface.

```bash
# Backend (Local)
python manage.py test

# Backend (Docker)
docker compose run --rm app python manage.py test

# Frontend (Unitários/Integração)
cd frontend && npm test

# Frontend (E2E - Requer backend rodando)
cd frontend && npm run test:e2e
```

---

## 📡 API Documentation

A API expõe endpoints para as operações de merchants e ações específicas para transição de status, cobrindo os 9 pontos do enunciado.

### Endpoints Principais

| # | Ação | Método | Rota | Payload |
|---|---|---|---|---|
| 1 | Cadastrar merchant | `POST` | `/api/merchants/` | `cnpj`, `legal_name`, `contact_email`, etc. |
| 2 | Consultar por ID | `GET` | `/api/merchants/{id}/` | - |
| 3 | Listar com filtro | `GET` | `/api/merchants/?status=draft` | Query param `status` |
| 4 | Atualizar em `draft` | `PATCH`| `/api/merchants/{id}/` | Dados a atualizar |

### Ações de Transição de Status
As transições possuem endpoints dedicados para garantir a imutabilidade das regras de negócio.

| # | Ação | Método | Rota | Regra de Negócio |
|---|---|---|---|---|
| 5 | Enviar para análise | `POST` | `.../{id}/submit-for-analysis/` | Apenas de `draft` para `pending_analysis`. |
| 6 | Aprovar | `POST` | `.../{id}/approve/` | Apenas de `pending_analysis` para `approved`. |
| 7 | Rejeitar | `POST` | `.../{id}/reject/` | Apenas de `pending_analysis` para `rejected`. **Exige motivo.** |
| 8 | Bloquear | `POST` | `.../{id}/block/` | Apenas de `approved` para `blocked`. **Exige motivo.** |
| 9 | Reabrir | `POST` | `.../{id}/reopen/` | Apenas de `rejected` para `draft`. |
| 10 | Desbloquear | `POST` | `.../{id}/unblock/` | Apenas de `blocked` para `approved`. |
| 11 | Timeline | `GET` | `.../{id}/timeline/` | Retorna o histórico de eventos. |


*Nota: Violações de regras de negócio retornam `422 Unprocessable Entity`.*

---

## 📊 Modelo de Dados e Regras de Negócio

### Campos do Merchant
- **Obrigatórios:** `cnpj` (único), `legal_name` (razão social), `contact_email`.
- **Opcionais:** `trade_name` (nome fantasia), `phone`.
- **Sistema:** `created_at` (data de criação), `status` (status atual).

### Status Possíveis
`draft` ➔ `pending_analysis`
`pending_analysis` ➔ `approved`
`pending_analysis` ➔ `rejected`
`approved` ➔ `blocked`
`rejected` ➔ `draft`
`blocked` ➔ `approved`

### Timeline de Eventos (Strings Exatas)
O sistema mantém uma linha do tempo rigorosa. As mensagens dos eventos seguem estritamente o padrão do enunciado:
1. **Envio para análise:** `"Merchant enviado para análise"`
2. **Aprovação:** `"Merchant aprovado"`
3. **Rejeição:** `"Merchant rejeitado: <motivo>"`
4. **Bloqueio:** `"Merchant bloqueado: <motivo>"`
5. **Desbloqueio:** `"Merchant desbloqueado: <motivo>"`
6. **Reabertura:** `"Merchant reaberto: <motivo>"`

---

## 🧠 Decisões Técnicas e Trade-offs (Explicadas com mais detalhes nas ADRs em docs/ADRs)

### 1. Arquitetura e Camada de Serviços (Clean Code)
- **Decisão:** Utilização de uma camada de serviços (`services.py`) para orquestrar as regras de negócio e transições de estado, separando-a das Views/ViewSets.
- **Trade-off:** Adiciona uma camada extra de indireção, mas mantém as `views` finas (focadas apenas em HTTP) e as regras de negócio altamente testáveis, reutilizáveis e independentes do contrato da API.

### 2. Transições de Estado Explícitas (Modelagem)
- **Decisão:** Em vez de permitir a alteração do campo `status` via `PATCH`, cada transição (`submit-for-analysis`, `approve`, `reject`, `block`) possui seu próprio endpoint dedicado.
- **Trade-off:** Aumenta o número de endpoints, mas garante que as regras de negócio (ex: "só pode aprovar se estiver em análise") sejam aplicadas de forma centralizada. O campo `status` é marcado como `read_only` no serializer, evitando inconsistências.

### 3. Timeline de Eventos
- **Decisão:** Os eventos são armazenados em um modelo separado (`MerchantEvent`) com chave estrangeira para `Merchant`.
- **Trade-off:** Exige um `JOIN` ou query extra para buscar a timeline, mas mantém o modelo de `Merchant` limpo e permite que a timeline cresça indefinidamente sem impactar a performance de leituras simples do merchant.

### 4. Tratamento de Erros
- **Decisão:** Erros de validação de formulário (ex: CNPJ inválido) retornam `400 Bad Request`, enquanto violações de regras de negócio (ex: tentar aprovar um merchant em `draft`) retornam `422 Unprocessable Entity`.
- **Trade-off:** Diferenciar os códigos HTTP ajuda o cliente da API a distinguir programaticamente entre "dados mal formados" e "operação não permitida pelo fluxo de negócio".

### 5. Banco de Dados (SQLite vs PostgreSQL)
- **Decisão:** O projeto suporta SQLite (padrão para simplificar testes locais) e PostgreSQL (via Docker).
- **Trade-off:** SQLite facilita a execução sem dependências externas. PostgreSQL é utilizado no Docker para maturidade operacional e preparar o ambiente para produção. A troca é transparente graças à configuração do Django.

---

## 📂 Estrutura do Projeto

```text
.
├── merchant_cad/        # Configurações do projeto Django
├── merchants/           # App Django principal
│   ├── migrations/      # Migrations do banco de dados
│   ├── services.py      # Regras de negócio e transições de estado
│   ├── models.py        # Modelagem de dados (Merchant, MerchantEvent)
│   ├── serializers.py   # Validação e serialização DRF
│   ├── viewsets.py      # Endpoints da API
│   └── tests/           # Testes automatizados do backend
├── frontend/            # Aplicação React (Vite + TypeScript)
│   ├── src/             # Componentes, páginas e hooks
│   └── e2e/             # Testes End-to-End (Playwright)
├── docs/                # Documentação
│   └── ADRs/            # Architecture Decision Records
├── docker-compose.yml   # Orquestração dos containers
├── requirements.txt     # Dependências Python de runtime
└── requirements-dev.txt # Dependências Python de desenvolvimento
```
