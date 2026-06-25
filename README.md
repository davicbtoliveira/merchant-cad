# Merchant CAD

Backend API for registering and reviewing merchants.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
```

## Run

```bash
python manage.py runserver
```

## Test

```bash
python manage.py test
```

## API fields

The API uses English field names:

```text
razao social    -> legal_name
nome fantasia   -> trade_name
e-mail contato  -> contact_email
telefone        -> phone
```

`cnpj`, `legal_name`, and `contact_email` are required. `trade_name` and `phone` are optional.

## Endpoints

```text
POST /api/merchants/
GET  /api/merchants/
GET  /api/merchants/?status=draft
GET  /api/merchants/{id}/
PATCH /api/merchants/{id}/
POST /api/merchants/{id}/submit-for-analysis/
POST /api/merchants/{id}/approve/
GET  /api/merchants/{id}/timeline/
```

New merchants start with status `draft`. CNPJ input may include punctuation, but is stored with digits only.
Merchant list and detail responses include only the public Merchant fields, without embedded timeline data.

Registration data can be updated only while a merchant is in `draft`. The `status` field is read-only in
regular create and update operations; workflow changes use explicit action endpoints.

`POST /api/merchants/{id}/submit-for-analysis/` moves a merchant from `draft` to `pending_analysis`,
creates the first timeline event with the message `Merchant enviado para análise`, and returns the updated
merchant. `POST /api/merchants/{id}/approve/` moves a merchant from `pending_analysis` to `approved`,
creates a timeline event with the message `Merchant aprovado`, and returns the updated merchant.
`GET /api/merchants/{id}/timeline/` returns that merchant's events in chronological order.
