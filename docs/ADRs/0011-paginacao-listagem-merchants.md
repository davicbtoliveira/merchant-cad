# Paginação da listagem de merchants

Status: Aceito

## Contexto

`GET /api/merchants/` retornava todos os registros em uma única resposta. Com crescimento da base, isso aumenta custo de query, serialização e tráfego HTTP, mesmo quando a UI precisa apenas de uma janela pequena de dados.

## Decisão

A listagem de merchants usa paginação por página do Django REST Framework no `MerchantViewSet`:

```text
GET /api/merchants/?page=1&page_size=20
GET /api/merchants/?status=draft&page=1&page_size=20
```

Contrato de resposta:

```json
{
  "count": 42,
  "next": "http://testserver/api/merchants/?page=2",
  "previous": null,
  "results": []
}
```

Parâmetros:

- `page`: página desejada.
- `page_size`: tamanho da página.
- `page_size` padrão: `20`.
- `page_size` máximo: `100`.

O filtro `status` continua sendo aplicado antes da paginação.

## Justificativa

Paginação por página é o caminho mais direto no DRF, mantém o endpoint legível para clientes e elimina respostas sem limite. O limite máximo evita uso abusivo de `page_size` sem introduzir configuração complexa.

## Alternativas rejeitadas

Paginação global em `REST_FRAMEWORK`: rejeitada para não alterar endpoints como `timeline`, que continuam pequenos e semanticamente cronológicos.

Cursor pagination: rejeitada por adicionar contrato mais complexo antes de haver necessidade real. A ordenação por `id` do modelo já torna a paginação por página estável para o volume esperado.

Manter resposta como array e enviar metadados em headers: rejeitada porque esconde `count`, `next` e `previous` do corpo JSON e foge do padrão DRF usado no backend.
