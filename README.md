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
GET  /api/merchants/{id}/
```

New merchants start with status `draft`. CNPJ input may include punctuation, but is stored with digits only.

