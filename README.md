# Merchant CAD

API backend para cadastro e análise de merchants.

## Configuração

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
```

## Execução

```bash
python manage.py runserver
```

## Testes

```bash
python manage.py test
```

## Campos da API

A API usa nomes de campos em inglês:

```text
razão social    -> legal_name
nome fantasia   -> trade_name
e-mail contato  -> contact_email
telefone        -> phone
```

`cnpj`, `legal_name` e `contact_email` são obrigatórios. `trade_name` e `phone` são opcionais.

## Endpoints

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

Novos merchants começam com status `draft`. O CNPJ de entrada pode incluir pontuação, mas é salvo apenas
com dígitos. As respostas de listagem e detalhe incluem apenas os campos públicos do Merchant, sem dados
da timeline embutidos.

Dados cadastrais só podem ser atualizados enquanto o merchant está em `draft`. O campo `status` é somente
leitura nas operações comuns de criação e atualização; mudanças de fluxo usam endpoints de ação explícitos.

`POST /api/merchants/{id}/submit-for-analysis/` move um merchant de `draft` para `pending_analysis`,
cria o primeiro evento da timeline com a mensagem `Merchant enviado para análise` e retorna o merchant
atualizado.

`POST /api/merchants/{id}/approve/` move um merchant de `pending_analysis` para `approved`, cria um
evento na timeline com a mensagem `Merchant aprovado` e retorna o merchant atualizado.

`POST /api/merchants/{id}/reject/` aceita um payload com `reason` não vazio, move um merchant de
`pending_analysis` para `rejected`, cria um evento na timeline com a mensagem
`Merchant rejeitado: <motivo>` e retorna o merchant atualizado. Rejeição sem `reason`, ou com `reason`
vazio, retorna `400 Bad Request`. Rejeição em status inválido retorna erro de negócio com
`422 Unprocessable Entity`.

`POST /api/merchants/{id}/block/` aceita um payload com `reason` não vazio, move um merchant de
`approved` para `blocked`, cria um evento na timeline com a mensagem
`Merchant bloqueado: <motivo>` e retorna o merchant atualizado. Bloqueio sem `reason`, ou com `reason`
vazio, retorna `400 Bad Request`. Bloqueio em status inválido retorna erro de negócio com
`422 Unprocessable Entity`.

`GET /api/merchants/{id}/timeline/` retorna os eventos daquele merchant em ordem cronológica.

## Decisões técnicas

- **Django + Django REST Framework** — escolha do ecossistema Django pela produtividade, ORM embutido e suporte a migrations, combinado com DRF para expor a API REST de forma consistente.
- **SQLite como banco inicial** — elimina dependência externa de banco de dados; migrations funcionam com `python manage.py migrate` sem configurar PostgreSQL ou Docker.
- **Sem autenticação** — fora do escopo do desafio; a API não exige tokens, sessões nem permissões.
- **Status controlado por endpoints explícitos** — cada transição de status tem seu próprio endpoint (`submit-for-analysis`, `approve`, `reject`, `block`), validando regras de negócio e gerando eventos na timeline. O campo `status` é somente leitura nas operações comuns.
- **Timeline separada do Merchant** — eventos são armazenados em modelo próprio (`MerchantEvent`) e expostos em endpoint dedicado, mantendo o detalhe do Merchant simples.
- **CNPJ normalizado** — o valor enviado é limpo de pontuação e salvo apenas com dígitos, garantindo unicidade independente da formatação de entrada.
- **Camada de serviços** — regras de transição ficam em `services.py`, mantendo as views finas e as regras testáveis independentemente do contrato HTTP.
- **Transições inválidas retornam `422 Unprocessable Entity`** — separa erros de negócio de erros de validação de formulário (`400`).

Essas decisões estão documentadas em detalhe em `docs/ADRs/`.

## Fora do escopo inicial

- Autenticação e autorização.
- Frontend (SPA ou renderizado no servidor).
- Docker e PostgreSQL (substituíveis sem alterar o código da aplicação).
- Validação formal de CNPJ (dígitos verificadores e tamanho exato).
- Integração com API pública de CNPJ (gov.br).
- Paginação, ordenação avançada e busca textual.
- Painel administrativo customizado do Django.
