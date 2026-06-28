# Modularização do frontend por responsabilidade

Status: Aceito

Amenda o ADR 0005 (Frontend React para cadastro de Merchants).

## Contexto

O frontend nasceu com organização `feature-first` dentro de `src/merchants/`. Esse formato era suficiente enquanto o cliente tinha poucos arquivos, mas o módulo de merchants passou a acumular responsabilidades diferentes no mesmo agrupamento:

- chamadas HTTP;
- hooks de TanStack Query;
- componentes de UI de domínio;
- páginas roteáveis;
- types e interfaces;
- formatações e validações auxiliares.

O caso mais claro era o antigo `src/merchants/api/merchants.ts`, que reunia types, funções `fetch`, hooks React Query e formatações. Isso dificultava reaproveitamento, teste isolado e leitura da fronteira entre transporte, cache e apresentação.

## Decisão

O frontend passa a usar organização por responsabilidade no nível de `src/`:

```text
src/
├── api/
│   └── merchants.ts
├── hooks/
│   └── useMerchants.ts
├── components/
│   ├── Actions.tsx
│   ├── Form.tsx
│   ├── Table.tsx
│   ├── StatusBadge.tsx
│   └── Timeline.tsx
├── pages/
│   ├── List.tsx
│   ├── Detail.tsx
│   ├── Edit.tsx
│   ├── New.tsx
│   └── index.ts
├── types/
│   └── merchant.ts
├── utils/
│   ├── cnpj.ts
│   ├── date.ts
│   └── phone.ts
├── ui/
├── App.tsx
└── main.tsx
```

Responsabilidades:

- `api/merchants.ts`: apenas chamadas HTTP puras e tratamento de erro vindo da API.
- `hooks/useMerchants.ts`: apenas hooks de TanStack Query e invalidações de cache.
- `types/merchant.ts`: types e interfaces compartilhadas do domínio.
- `utils/cnpj.ts`, `utils/date.ts`, `utils/phone.ts`: funções puras de normalização, validação e formatação.
- `components/`: componentes reutilizáveis do fluxo de merchants.
- `pages/`: componentes roteáveis usados diretamente pelo `App.tsx`.

A lógica de negócio, tratamento customizado de erros nas mutations e estratégia de invalidação do TanStack Query permanecem inalterados.

## Justificativa

A nova estrutura aplica separação de responsabilidades sem introduzir abstrações novas. A fronteira fica explícita:

- `api` sabe falar HTTP, mas não sabe sobre React Query.
- `hooks` sabem cachear e invalidar, mas delegam transporte para `api`.
- `components` e `pages` consomem hooks, types e formatters sem depender do layout antigo de feature.
- `utils` continuam testáveis como funções puras.

Essa organização reduz acoplamento acidental e torna mais barato mover ou testar uma parte do frontend sem arrastar responsabilidades não relacionadas.

## Consequências

- Imports mudam para os novos diretórios raiz (`api`, `hooks`, `components`, `pages`, `types`, `utils`).
- O antigo diretório `src/merchants/` deixa de existir.
- O ADR 0005 continua válido para stack, rotas e fluxo de dados, mas sua seção "Estrutura do frontend" fica substituída por esta decisão.
- Como o domínio ainda é único, nomes de componentes ficam mais curtos (`Table`, `Form`, `Actions`) dentro do contexto do projeto.
- Caso novos domínios sejam adicionados no futuro, a estrutura pode exigir reavaliação entre organização por responsabilidade global e organização por feature.

## Alternativas rejeitadas

Manter `feature-first` em `src/merchants/`: rejeitada porque o domínio único fez o agrupamento virar um pacote genérico de frontend, com arquivos internos acumulando responsabilidades demais.

Criar barrel files para todos os diretórios: rejeitada para evitar indirection desnecessário. Imports diretos deixam dependências visíveis.

Separar cada hook de status em arquivo próprio: rejeitada porque todos compartilham a mesma mecânica de `useStatusTransition`; separar agora criaria arquivos pequenos demais sem reduzir complexidade.

Introduzir alias de import (`@/api`, `@/components`): rejeitada para manter a mudança restrita à organização dos arquivos, sem alterar configuração TypeScript/Vite.
