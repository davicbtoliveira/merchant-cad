# Contrato da API para campos e CNPJ

Status: Aceito

O contrato da API usará nomes de campos em inglês, mesmo que o enunciado use termos em português. A decisão mantém o código Django/DRF mais consistente e preserva os status já definidos em inglês pelo próprio desafio.

## Decisão

A API usará os seguintes campos principais para `Merchant`:

```text
cnpj
legal_name
trade_name
contact_email
phone
created_at
status
```

A relação com os termos do enunciado será documentada no README:

```text
razão social    -> legal_name
nome fantasia  -> trade_name
e-mail contato -> contact_email
telefone       -> phone
```

`cnpj`, `legal_name` e `contact_email` serão obrigatórios. `trade_name` e `phone` serão opcionais, porque o enunciado lista esses dados como atributos do merchant, mas só declara CNPJ, razão social e e-mail como obrigatórios nas regras de cadastro.

## CNPJ

O CNPJ será obrigatório, único e salvo no banco como texto contendo apenas dígitos. A API poderá receber CNPJ com pontuação, mas antes de salvar manterá somente os números.

Exemplo:

```text
Entrada: 12.345.678/0001-90
Banco:   12345678000190
```

Nesta etapa não haverá validação formal de CNPJ, como tamanho exato ou dígitos verificadores. Essa validação fica para uma evolução futura, possivelmente junto de uma integração com uma API pública para consulta e preenchimento automático dos dados do merchant.

## Alternativa rejeitada

Foi considerada a opção de usar campos em português, como `razao_social`, `nome_fantasia` e `email_contato`. Essa opção foi rejeitada para manter o contrato da API e o código interno em uma linguagem única, reduzindo tradução mental dentro do backend. A tradução para os termos do desafio será feita na documentação.
