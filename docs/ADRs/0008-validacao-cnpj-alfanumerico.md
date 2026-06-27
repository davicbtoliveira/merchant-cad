# Validação de CNPJ alfanumérico

Status: Aceito

Amenda o ADR 0003 (contrato da API para campos e CNPJ). O ADR 0003 estabelecia que o CNPJ seria salvo como texto contendo apenas dígitos e diferia a validação formal para uma evolução futura. A Instrução Normativa RFB nº 2.229, de 15 de outubro de 2024, estabelece o formato alfanumérico para o identificador do CNPJ a partir de julho de 2026, atribuído exclusivamente a novas inscrições (CNPJs existentes não mudam). Esta decisão implementa a validação formal do CNPJ, agora alfanumérico, e ajusta o storage para comportar letras.

## Decisão

O CNPJ passa a ser validado formalmente e armazenado em formato alfanumérico normalizado.

### Storage

- Campo `Merchant.cnpj`: `CharField(max_length=14)` (antes `32`). Tightening via migration.
- Forma normalizada: 14 caracteres, maiúscula, sem pontuação (`.` `/` `-` e espaços removidos).
- Exemplo: `AB.345.678/000B-72` → `AB345678000B72`.

### Estrutura do CNPJ alfanumérico (14 posições)

```text
AA.345.678/000B-72
├── Raiz:  8 posições alfanuméricas (AA345678)
├── Ordem: 4 posições alfanuméricas (000B)
└── DV:    2 posições SEMPRE numéricas (72)
```

- Charset: `[A-Z0-9]` (Base 36 — letras A-Z todas permitidas, sem exclusões; case-insensitive na entrada, normalizado para maiúscula).
- Os 2 dígitos verificadores (posições 13 e 14) são sempre numéricos, mesmo em CNPJs alfanuméricos.

### Algoritmo do dígito verificador

Módulo 11, com o valor numérico de cada caractere dado por `ord(char) - 48`:

```text
'0'..'9' → ord(char) - 48 = 0..9   (idêntico ao CNPJ numérico legado)
'A'..'Z' → ord(char) - 48 = 17..42 (novo no alfanumérico)
```

Pesos:

- DV1 (sobre os 12 primeiros caracteres): `[5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]`
- DV2 (sobre os 13 primeiros, incluindo DV1): `[6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]`

Cálculo de cada DV:

```text
total     = Σ (ord(char) - 48) * peso
remainder = total % 11
dv        = 0 if remainder < 2 else 11 - remainder
```

O DV calculado é sempre um dígito (0-9), o que é consistente com a regra de que as duas posições finais são numéricas.

### Regras de validação

Um CNPJ é válido se, após normalização:

1. Tem exatamente 14 caracteres no charset `[A-Z0-9]`.
2. Não é composto por um único caractere repetido (ex.: `00000000000000`).
3. As duas posições finais (DV) são numéricas.
4. DV1 calculado == posição 13.
5. DV2 calculado == posição 14.

### Backward compatibility

CNPJs numéricos legados (todos dígitos, 14 posições) permanecem válidos sob o novo algoritmo, pois `ord('0'..'9') - 48 == 0..9` reproduz exatamente o cálculo do CNPJ numérico tradicional. Consequentemente:

- Dados existentes no banco (CNPJs numéricos de 14 dígitos) continuam válidos — nenhuma transformação de dados é necessária, apenas o tightening do `max_length` de 32 para 14.
- O validador aceita tanto o formato numérico legado quanto o alfanumérico novo.

## Implementação

- Novo módulo `merchants/validators.py` com `CNPJValidator.normalize` (regex strip `.-/\s` + upper) e `CNPJValidator.validate` (retorna o CNPJ normalizado ou levanta `rest_framework.exceptions.ValidationError`).
- `MerchantSerializer.validate_cnpj` passa a chamar `CNPJValidator.validate` e ainda preserva a checagem de unicidade existente. A função `normalize_cnpj` local em `serializers.py` (que mantinha apenas dígitos) é substituída pela do novo módulo.
- Migration tightening `cnpj` para `max_length=14`.

## Alternativa rejeitada

Foi considerada a manutenção de `max_length=32`. Rejeitada porque o validador já força exatamente 14 caracteres na entrada; manter 32 no banco permitiria armazenar CNPJs inválidos por caminhos que bypassam o serializer (admin, shell, SQL direto), enfraquecendo o invariante de integridade. O tightening para 14 alinha schema e contrato sem custo de migração de dados, dado que todos os valores existentes já têm 14 caracteres.

## Referência

- Instrução Normativa RFB nº 2.229, de 15 de outubro de 2024.
- Manual de Cálculo do DV do CNPJ Alfanumérico (Receita Federal, publicado em 05/11/2024).
