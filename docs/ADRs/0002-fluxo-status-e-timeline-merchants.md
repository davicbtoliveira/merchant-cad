# Fluxo de status e timeline de Merchants

Status: Aceito

Mudanças de status serão tratadas como ações explícitas do fluxo de análise, e não como uma simples edição do campo `status`. Essa decisão deixa as regras de negócio mais claras, evita transições inválidas e garante que cada mudança relevante gere um evento na timeline.

## Decisão

A API terá endpoints específicos para as transições de status:

```text
POST /api/merchants/{id}/submit-for-analysis/
POST /api/merchants/{id}/approve/
POST /api/merchants/{id}/reject/
POST /api/merchants/{id}/block/
```

O campo `status` será somente leitura nas operações comuns de criação, consulta e atualização cadastral. Atualizações via `PATCH /api/merchants/{id}/` serão usadas apenas para dados cadastrais e somente enquanto o merchant estiver em `draft`.

As regras de transição ficarão em uma camada simples de serviços. Cada serviço validará o status atual, aplicará a mudança permitida e criará o evento correspondente na timeline.

## Regras do fluxo

- `draft` pode ir para `pending_analysis`.
- `pending_analysis` pode ir para `approved`.
- `pending_analysis` pode ir para `rejected`, com motivo obrigatório.
- `approved` pode ir para `blocked`, com motivo obrigatório.
- Merchants fora de `draft` não podem ter dados cadastrais alterados.

Transições inválidas retornarão erro de negócio com HTTP `400 Bad Request`.

## Timeline

A timeline será consultada por um endpoint próprio:

```text
GET /api/merchants/{id}/timeline/
```

Os eventos serão retornados em ordem cronológica, com `created_at`. A criação do merchant em `draft` não gera evento na timeline; o primeiro evento esperado é o envio para análise.

## Alternativa rejeitada

Foi considerada a opção de permitir mudança de status por `PATCH /api/merchants/{id}/`, enviando um novo valor para `status`. Essa opção foi rejeitada porque mistura atualização cadastral com avanço de fluxo, dificulta a exigência de motivo em rejeição e bloqueio, e deixa menos explícito quais transições são permitidas.
