# Glossário do domínio

Contexto responsável pelo cadastro e análise de merchants antes que eles possam operar na plataforma.

## Linguagem

**Merchant**:
Estabelecimento comercial cadastrado para análise antes de operar na plataforma.
_Evitar_: Estabelecimento, empresa, loja

**Status do Merchant**:
Estado atual do merchant dentro do fluxo de análise. Os status definidos são `draft`, `pending_analysis`, `approved`, `rejected` e `blocked`.
_Evitar_: Situação, etapa, fase

**Draft**:
Status inicial de um merchant recém-cadastrado. Enquanto está em `draft`, seus dados cadastrais podem ser alterados.
_Evitar_: Rascunho, pendente de cadastro

**Pending analysis**:
Status do merchant enviado para análise e ainda sem decisão final.
_Evitar_: Em aprovação, aguardando aprovação

**Approved**:
Status do merchant que foi aprovado para operar na plataforma.
_Evitar_: Ativo, liberado

**Rejected**:
Status do merchant que foi rejeitado após análise, sempre com um motivo associado ao evento de rejeição.
_Evitar_: Recusado, negado

**Blocked**:
Status do merchant previamente aprovado que foi bloqueado, sempre com um motivo associado ao evento de bloqueio.
_Evitar_: Suspenso, desativado

**Timeline**:
Histórico cronológico dos eventos de negócio ocorridos com um merchant.
_Evitar_: Histórico, log

**Merchant Event**:
Evento de negócio registrado na timeline de um merchant, como envio para análise, aprovação, rejeição ou bloqueio.
_Evitar_: Log técnico, auditoria técnica
