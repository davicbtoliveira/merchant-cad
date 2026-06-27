# Escopo inicial da API de Merchants

Status: Aceito

A implementação inicial será focada apenas no backend core da API de Merchants, usando Django e Django REST Framework, sem autenticação e sem frontend nesta etapa. A decisão reduz o escopo inicial para o que é essencial no teste: cadastro, consulta, listagem com filtro por status, atualização cadastral em `draft`, transições de status, timeline de eventos, testes automatizados, migrations e README.

## Decisão

A primeira versão terá uma API REST para Merchants com os status `draft`, `pending_analysis`, `approved`, `rejected` e `blocked`. O status atual ficará no modelo `Merchant`; a timeline ficará em um modelo separado, `MerchantEvent`, que registrará eventos de negócio como envio para análise, aprovação, rejeição e bloqueio.

As mudanças de status não serão feitas por atualização direta do campo `status`. Elas terão endpoints explícitos, como enviar para análise, aprovar, rejeitar e bloquear. Rejeição e bloqueio exigirão um `reason`. As regras de transição ficarão em uma camada simples de serviços, para manter serializers e views focados na entrada e saída da API.

O endpoint de detalhe do merchant retornará apenas os dados do merchant. A timeline será consultada por um endpoint próprio:

```text
GET /api/merchants/{id}/timeline/
```

Os eventos serão retornados em ordem cronológica, com `created_at`, para permitir que uma interface futura mostre a data/hora de cada evento.

## Fora do escopo desta etapa

Não serão implementados autenticação, frontend, integração com gov.br ou validação completa de CNPJ nesta primeira etapa. O CNPJ será obrigatório, único e salvo apenas com dígitos em um campo texto, mas a validação formal do número ficará para uma evolução futura.

Postgres em Docker e frontend ficam planejados para depois, quando a API core e suas regras de negócio já estiverem cobertas por testes. A decisão posterior sobre o ambiente Docker/PostgreSQL está documentada no ADR 0004.

## Consequências

Essa abordagem mantém a entrega inicial menor, testável e alinhada aos requisitos principais do desafio. Também deixa explícito onde cada responsabilidade vive: o `Merchant` representa o estado atual, o `MerchantEvent` representa o histórico, os serializers funcionam como DTOs da API, e os serviços concentram as regras de negócio.
