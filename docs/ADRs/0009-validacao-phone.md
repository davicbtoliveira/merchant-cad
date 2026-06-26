# Validação do campo phone

Status: Aceito

Complementa o ADR 0003 (contrato da API para campos e CNPJ). Hoje `phone` é `CharField(max_length=32, blank=True)` sem validação de conteúdo, aceitando qualquer string — inclusive letras. Esta decisão introduz validação para garantir que o campo, quando preenchido, seja de fato um número de telefone (apenas dígitos, cobertura para números brasileiros), e define o comportamento de máscara na UI.

## Decisão

### Contrato backend (API)

- `phone` permanece opcional (`blank=True`).
- Quando preenchido, deve conter **apenas dígitos** (`[0-9]`).
- Length: **10 ou 11 dígitos** (cobertura Brasil — fixo 10 = DDD 2 + número 8; móvel 11 = DDD 2 + número 9).
- Entradas com letras, pontuação (`(`, `)`, `-`, `+`, espaços) ou outros não-dígitos são rejeitadas com `400 Bad Request`.
- Storage: armazenado exatamente como recebido (já é digits-only), sem normalização backend.

### Contrato frontend (UI)

A UI aplica máscara de formatação durante a digitação, exibindo o número no formato brasileiro:

- Após os 2 primeiros dígitos, envolve o DDD com `()`.
- Insere `-` antes dos 4 últimos dígitos do número.

Exemplos de exibição:

```text
Fixo  (10 dígitos): (11) 1234-5678
Móvel (11 dígitos): (11) 91234-5678
```

A máscara é apenas apresentação. Ao enviar para a API, o frontend envia apenas os dígitos (`11912345678`), nunca a string formatada. Isso mantém o contrato backend de digits-only.

### Implementação

- `MerchantSerializer.validate_phone`: rejeita se vazio em branco é permitido (opcional); se preenchido, valida `^[0-9]{10,11}$`.
- Frontend (conforme ADR 0005): input com máscara `(DD) xxxx-xxxx` / `(DD) 9xxxx-xxxx`, stripping de não-dígitos antes do POST.

## Alternativa rejeitada

Foi considerada a normalização backend (aceitar entrada formatada como `(11) 91234-5678`, strippar não-dígitos, armazenar `11912345678`) — espelhando o padrão do `normalize_cnpj`. Rejeitada porque o usuário quer validação estrita no input: o backend deve rejeitar entradas que não sejam de fato números de telefone, em vez de aceitar e limpar silenciosamente. A responsabilidade de formatar/exibir fica no frontend; o backend permanece com contrato simples de digits-only.

Também foi considerada validação por país (DDD válido, número por região). Rejeitada como excesso de escopo para esta etapa — a checagem de length 10-11 já garante cobertura dos formatos brasileiros sem acoplar a regras de DDD específicas.
