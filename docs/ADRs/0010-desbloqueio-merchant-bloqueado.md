# Desbloqueio de merchant bloqueado

Status: Aceito

Amenda o ADR 0002 (fluxo de status). Hoje `blocked` é terminal: merchant aprovado que foi bloqueado não volta a operar. Esta decisão introduz a transição `blocked -> approved` para permitir o desbloqueio de um merchant previamente bloqueado, restaurando-o ao estado de aprovado.

## Decisão

Nova transição de status:

```text
blocked -> approved   (ação: unblock)
```

A transição é exposta por endpoint próprio, exigindo motivo obrigatório, e gera evento na timeline:

```text
POST /api/merchants/{id}/unblock/
```

Corpo da requisição:

```json
{ "reason": "texto obrigatório e não vazio" }
```

Reusa o `MerchantRejectSerializer` (serializer de campo único `reason`), mesmo padrão adotado por `reject`, `block` e `reopen`.

## Justificativa do estado-alvo

Diferente de `reopen` (que leva `rejected -> draft` para permitir correção de dados cadastrais), `unblock` leva `blocked -> approved` diretamente. O merchant já havia sido aprovado antes do bloqueio; o bloqueio representa uma suspensão operacional (não uma rejeição de dados), de modo que o desbloqueio restaura o estado pré-bloqueio sem exigir reedição cadastral nem nova passagem por análise. Os dados do merchant não mudaram durante o bloqueio.

## Regras do fluxo

- `blocked` pode ir para `approved` via `unblock`, com motivo obrigatório.
- `unblock` só é permitido a partir de `blocked`. `rejected` tem tratamento separado (`reopen`, ADR 0007).
- `unblock` gera evento na timeline com a mensagem `"Merchant desbloqueado: {reason}"`.
- Transições inválidas continuam retornando `422 Unprocessable Entity`.

## Timeline

`unblock` é uma ação de negócio e gera evento, mantendo a timeline como trilha de auditoria da saída de estado terminal — padrão já adotado por `reject`, `block` e `reopen`. O motivo informado fica registrado no evento.

## Alternativa rejeitada

Foi considerada a transição `blocked -> draft` (espelhando `reopen`), forçando reedição cadastral e reenvio a análise. Rejeitada porque o bloqueio não indica dado cadastral incorreto — indica suspensão operacional de um merchant já aprovado. Submeter o merchant a uma nova análise completa seria desnecessário e oneroso quando a intenção é apenas restaurar o status de aprovado.

Também foi considerada a permissão de escolher entre `approved` e `draft` no desbloqueio. Rejeitada por adicionar complexidade ao state machine (dois endpoints de saída de `blocked`) sem necessidade clara: se o dado cadastral precisa ser corrigido, o caminho adequado é bloquear/cancelar e recriar, não introduzir um fluxo híbrido de desbloqueio.
