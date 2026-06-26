# Frontend React para cadastro de Merchants

Status: Aceito

Decidi adicionar um frontend React como complemento à API de Merchants, reconhecendo que, no contexto de um teste técnico para uma vaga que exige Python e React no dia a dia, entregar os dois demonstra melhor o perfil esperado. O frontend cobre as mesmas operações da API — cadastro, consulta, listagem com filtro, edição em `draft`, transições de status e timeline — e se comunica com o backend exclusivamente via HTTP.

## Stack e decisão técnica

Usei **React + Vite** em vez de Next.js ou Django Templates porque:

- React + Vite é o setup mais direto para uma SPA que consome uma API separada.
- Next.js adicionaria complexidade de SSR/SSG que não agrega valor a um sistema onde o backend já entrega todos os dados via REST.
- Django Templates + React exigiria django-vite ou webpack para empacotar o frontend dentro do Django, o que amarra o deploy dos dois lados desnecessariamente.

Escolhi **TanStack Query** para data fetching porque ele abstrai cache, loading states e refetch de forma declarativa, sem exigir um store global. As mutations usam `fetch` nativo (sem axios) para manter zero dependências HTTP. A invalidação após mutation é simples e garante consistência sem complexidade de optimistic update.

Usei **React Hook Form** com validação nativa do HTML5 para os formulários. Sem Zod ou Yup — as regras de validação são poucas (campos obrigatórios, formato de e-mail) e a validação no backend é a fonte da verdade. Erros de negócio (422) vindos do backend são tratados com toast via **Sonner** e mensagens inline nos formulários.

Usei **Tailwind CSS** para estilização porque é produtivo, não exige contexto de CSS modules/classes nomeadas, e produz um resultado visual consistente sem um design system externo.

O frontend roda em um container separado no Docker Compose, com o Vite fazendo proxy das chamadas `/api/` para o container Django em desenvolvimento.

## Estrutura do frontend

```
src/
├── merchants/
│   ├── api/           # funções fetch + queries/mutations TanStack Query
│   ├── components/    # MerchantTable, MerchantForm, MerchantTimeline, MerchantStatusBadge
│   └── pages/         # MerchantListPage, MerchantNewPage, MerchantDetailPage, MerchantEditPage
├── ui/                # componentes genéricos (Button, Input, Select, Toast, Spinner)
├── App.tsx
└── main.tsx
```

Usei organização **feature-first** porque o domínio é pequeno (só Merchants) mas a separação por tipo de código (api/components/pages) dentro da feature já prepara o projeto para crescer sem bagunça.

## Rotas

| Caminho | Página |
|---|---|
| `/merchants` | MerchantListPage |
| `/merchants/new` | MerchantNewPage |
| `/merchants/:id` | MerchantDetailPage |
| `/merchants/:id/edit` | MerchantEditPage |

## Componentes por página

**MerchantListPage**: Tabela com colunas CNPJ, razão social, status, data de criação. Botão "Novo merchant". Linha clicável leva ao detalhe. Filtro por status no topo.

**MerchantNewPage**: Formulário com campos CNPJ, razão social, nome fantasia, e-mail, telefone. Após criar, redireciona para o detalhe.

**MerchantDetailPage**: Dados do merchant + status badge + botões de ação condicionais ao status atual (enviar para análise, aprovar, rejeitar, bloquear). Abaixo, o componente `MerchantTimeline` mostra os eventos em ordem cronológica.

**MerchantEditPage**: Mesmo formulário da criação, pré-preenchido. Só acessível se o merchant está em `draft`; o backend já valida essa regra.

## Fluxo de dados

Cada página usa TanStack Query (`useQuery` / `useMutation`) apontando para funções em `merchants/api/` que chamam `fetch()` contra `/api/merchants/...`. Após criação, edição ou ação de transição, a query da lista e/ou do detalhe é invalidada para refletir o estado mais recente.

## Consequências

- O avaliador precisa de Node.js 20+ para rodar o frontend localmente, ou pode usar Docker Compose que já sobe os dois containers.
- Decisões de visual e UX ficam no frontend e não poluem o backend (sem templates Django, sem renderização híbrida).
- A API REST continua sendo a única fonte de verdade — o frontend é um cliente descartável que pode ser trocado sem afetar o backend.
- TanStack Query + Sonner + React Hook Form + Tailwind são dependências adicionais, mas cada uma resolve um problema específico sem excesso de abstração.

## Alternativas rejeitadas

- **Next.js**: Rejeitado porque SSR/SSR não agrega valor a um sistema interno onde o backend já entrega dados via REST. Adicionaria complexidade de build e deploy sem benefício real para o teste.
- **RTK Query**: Rejeitado porque exigiria Redux Toolkit inteiro, o que é mais boilerplate que o necessário para um cliente que só consome uma API REST.
- **React Hook Form + Zod**: Rejeitado porque as validações de formulário são simples (obrigatoriedade, formato de e-mail) e a validação real está no backend. Zod adicionaria um schema duplicado sem benefício.
- **CSS Modules ou styled-components**: Rejeitados em favor de Tailwind por produtividade e consistência visual.
