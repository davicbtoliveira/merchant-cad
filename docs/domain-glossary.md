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
Status do merchant que foi rejeitado após análise, sempre com um motivo associado ao evento de rejeição. Não é terminal: pode voltar a `draft` via `reopen` para correção e nova submissão.
_Evitar_: Recusado, negado

**Reopen**:
Ação de reabrir um merchant em `rejected`, levando-o de volta a `draft` com motivo obrigatório, para permitir edição cadastral e nova submissão para análise.
_Evitar_: Reativar, restaurar, resubmeter (resubmeter é o envio a `pending_analysis`, não o retorno a `draft`)

**Blocked**:
Status do merchant previamente aprovado que foi bloqueado, sempre com um motivo associado ao evento de bloqueio. Não é terminal: pode voltar a `approved` via `unblock` para restauração operacional.
_Evitar_: Suspenso, desativado

**Unblock**:
Ação de desbloquear um merchant em `blocked`, levando-o de volta a `approved` com motivo obrigatório, restaurando o status pré-bloqueio sem reedição cadastral nem nova análise.
_Evitar_: Reativar, restaurar, liberar

**Timeline**:
Histórico cronológico dos eventos de negócio ocorridos com um merchant.
_Evitar_: Histórico, log

**Merchant Event**:
Evento de negócio registrado na timeline de um merchant, como envio para análise, aprovação, rejeição, bloqueio ou reabertura.
_Evitar_: Log técnico, auditoria técnica

**CNPJ**:
Identificador da pessoa jurídica, armazenado em formato alfanumérico normalizado (14 caracteres, maiúscula, sem pontuação). Validação formal por módulo 11 com valores `ord(char)-48`, conforme IN RFB 2.229/2024. Aceita tanto o formato numérico legado quanto o alfanumérico novo (a partir de julho de 2026).
_Evitar_: CNPJ alfanumérico como conceito separado — é o mesmo identificador, com charset estendido.

**Phone**:
Número de telefone do merchant, opcional. Armazenado como apenas dígitos (10 ou 11, cobertura Brasil). A UI exibe máscara `(DD) xxxx-xxxx` / `(DD) 9xxxx-xxxx`, mas o contrato da API é digits-only.
_Evitar_: Telefone formatado no storage, fone
