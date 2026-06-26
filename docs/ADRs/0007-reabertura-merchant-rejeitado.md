# Reabertura de merchant rejeitado

Status: Aceito

Amenda o ADR 0002 (fluxo de status). Hoje `rejected` é terminal: merchant rejeitado não edita dados e não volta a `pending_analysis`. Esta decisão introduz a transição `rejected -> draft` para permitir que o merchant corrija os dados cadastrais que motivaram a rejeição e seja submetido a uma nova análise reaproveitando o fluxo existente.

## Decisão

Nova transição de status:

```text
rejected -> draft   (ação: reopen)
```

A transição é exposta por endpoint próprio, exigindo motivo obrigatório, e gera evento na timeline:

```text
POST /api/merchants/{id}/reopen/
```

Corpo da requisição:

```json
{ "reason": "texto obrigatório e não vazio" }
```

A reusa do `MerchantRejectSerializer` (serializer de campo único `reason`) é intencional; o nome do serializer descreve apenas o caso original, mas o contrato do campo é o mesmo: `CharField(allow_blank=False, allow_null=False)`.

A resubmissão em si **não** é uma ação nova. Após `reopen`, o merchant está em `draft` e o envio para análise usa o endpoint já existente:

```text
POST /api/merchants/{id}/submit-for-analysis/
```

Isso mantém a regra do ADR 0002: dados cadastrais só são editáveis em `draft`. Não se abre exceção para editar dados em `rejected`.

## Regras do fluxo

- `rejected` pode ir para `draft` via `reopen`, com motivo obrigatório.
- `reopen` só é permitido a partir de `rejected`. `blocked` tem tratamento separado (desbloqueio).
- Em `draft` (incluindo o `draft` alcançado via `reopen`), o merchant pode ter dados cadastrais alterados por `PATCH /api/merchants/{id}/` e pode ser submetido por `submit-for-analysis`.
- `reopen` gera evento na timeline com a mensagem `"Merchant reaberto: {reason}"`.
- Transições inválidas continuam retornando `422 Unprocessable Entity`.

## Timeline

`reopen` é uma ação de negócio e gera evento, diferente da criação do merchant em `draft` (que não gera evento, conforme ADR 0002). O motivo informado fica registrado no evento, mantendo a timeline como trilha de auditoria da saída de estado terminal — padrão já adotado por `reject` e `block`.

## Alternativa rejeitada

Foi considerada a transição direta `rejected -> pending_analysis` (ação `resubmit`), re-enfileirando o merchant para análise sem passar por `draft`. Rejeitada porque o caso típico de rejeição envolve dado cadastral incorreto; reenviar os mesmos dados reproduziria a rejeição. Sempre que o merchant precisa ser reanalisado, ele primeiro volta a `draft` para correção.

Também foi considerada a permissão de editar dados cadastrais diretamente em `rejected`, seguida de `resubmit` direto. Rejeitada porque quebra o invariante do ADR 0002 de que edição cadastral só ocorre em `draft`, adicionando um segundo estado editável e complexidade à regra de guarda `ensure_can_update_registration_data`.

Por fim, considerou-se `reopen` sem motivo obrigatório. Rejeitado por quebrar a simetria com `reject`/`block`, onde toda saída de estado terminal documenta o motivo na timeline.
