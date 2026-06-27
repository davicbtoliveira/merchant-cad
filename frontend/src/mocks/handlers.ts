import { http, HttpResponse } from "msw";
import type { Merchant, TimelineEvent } from "../merchants/api/merchants";

export const mockMerchants: Merchant[] = [
  {
    id: 1,
    cnpj: "11222333000181",
    legal_name: "Empresa Exemplo Ltda",
    trade_name: "Exemplo",
    contact_email: "contato@exemplo.com",
    phone: "11999999999",
    created_at: "2026-06-01T10:00:00Z",
    status: "draft",
  },
  {
    id: 2,
    cnpj: "AB345678000B72",
    legal_name: "Comércio ABC S.A.",
    trade_name: "ABC Comércio",
    contact_email: "abc@comercio.com",
    phone: "11888888888",
    created_at: "2026-06-15T14:30:00Z",
    status: "approved",
  },
  {
    id: 3,
    cnpj: "0NETF1OD000130",
    legal_name: "Serviços XYZ Ltda",
    trade_name: "XYZ Serviços",
    contact_email: "contato@xyz.com",
    phone: "11777777777",
    created_at: "2026-06-20T09:00:00Z",
    status: "pending_analysis",
  },
  {
    id: 4,
    cnpj: "12345678000438",
    legal_name: "Loja Rejeitada Ltda",
    trade_name: "Loja Rejeitada",
    contact_email: "rejeitada@loja.com",
    phone: "11666666666",
    created_at: "2026-06-21T09:00:00Z",
    status: "rejected",
  },
  {
    id: 5,
    cnpj: "12345678000519",
    legal_name: "Operação Bloqueada S.A.",
    trade_name: "Operação Bloqueada",
    contact_email: "bloqueada@operacao.com",
    phone: "11555555555",
    created_at: "2026-06-22T09:00:00Z",
    status: "blocked",
  },
];

export const mockTimeline: Record<number, TimelineEvent[]> = {
  2: [
    {
      id: 1,
      message: "Merchant criado",
      created_at: "2026-06-15T14:30:00Z",
    },
    {
      id: 2,
      message: "Merchant enviado para análise",
      created_at: "2026-06-16T09:00:00Z",
    },
    {
      id: 3,
      message: "Merchant aprovado",
      created_at: "2026-06-17T11:00:00Z",
    },
  ],
  3: [
    {
      id: 4,
      message: "Merchant criado",
      created_at: "2026-06-20T09:00:00Z",
    },
  ],
  4: [
    {
      id: 5,
      message: "Merchant criado",
      created_at: "2026-06-21T09:00:00Z",
    },
    {
      id: 6,
      message: "Merchant rejeitado: Documentação incompleta",
      created_at: "2026-06-22T10:00:00Z",
    },
  ],
  5: [
    {
      id: 7,
      message: "Merchant criado",
      created_at: "2026-06-22T09:00:00Z",
    },
    {
      id: 8,
      message: "Merchant bloqueado: Atividade suspeita",
      created_at: "2026-06-23T10:00:00Z",
    },
  ],
};

let nextId = 6;
let nextEventId = 9;

export function resetMockData() {
  mockMerchants.length = 0;
  mockMerchants.push(
    {
      id: 1,
      cnpj: "11222333000181",
      legal_name: "Empresa Exemplo Ltda",
      trade_name: "Exemplo",
      contact_email: "contato@exemplo.com",
      phone: "11999999999",
      created_at: "2026-06-01T10:00:00Z",
      status: "draft",
    },
    {
      id: 2,
      cnpj: "AB345678000B72",
      legal_name: "Comércio ABC S.A.",
      trade_name: "ABC Comércio",
      contact_email: "abc@comercio.com",
      phone: "11888888888",
      created_at: "2026-06-15T14:30:00Z",
      status: "approved",
    },
    {
      id: 3,
      cnpj: "0NETF1OD000130",
      legal_name: "Serviços XYZ Ltda",
      trade_name: "XYZ Serviços",
      contact_email: "contato@xyz.com",
      phone: "11777777777",
      created_at: "2026-06-20T09:00:00Z",
      status: "pending_analysis",
    },
    {
      id: 4,
      cnpj: "12345678000438",
      legal_name: "Loja Rejeitada Ltda",
      trade_name: "Loja Rejeitada",
      contact_email: "rejeitada@loja.com",
      phone: "11666666666",
      created_at: "2026-06-21T09:00:00Z",
      status: "rejected",
    },
    {
      id: 5,
      cnpj: "12345678000519",
      legal_name: "Operação Bloqueada S.A.",
      trade_name: "Operação Bloqueada",
      contact_email: "bloqueada@operacao.com",
      phone: "11555555555",
      created_at: "2026-06-22T09:00:00Z",
      status: "blocked",
    },
  );

  delete mockTimeline[1];
  mockTimeline[2] = [
    { id: 1, message: "Merchant criado", created_at: "2026-06-15T14:30:00Z" },
    {
      id: 2,
      message: "Merchant enviado para análise",
      created_at: "2026-06-16T09:00:00Z",
    },
    { id: 3, message: "Merchant aprovado", created_at: "2026-06-17T11:00:00Z" },
  ];
  mockTimeline[3] = [
    { id: 4, message: "Merchant criado", created_at: "2026-06-20T09:00:00Z" },
  ];
  mockTimeline[4] = [
    { id: 5, message: "Merchant criado", created_at: "2026-06-21T09:00:00Z" },
    {
      id: 6,
      message: "Merchant rejeitado: Documentação incompleta",
      created_at: "2026-06-22T10:00:00Z",
    },
  ];
  mockTimeline[5] = [
    { id: 7, message: "Merchant criado", created_at: "2026-06-22T09:00:00Z" },
    {
      id: 8,
      message: "Merchant bloqueado: Atividade suspeita",
      created_at: "2026-06-23T10:00:00Z",
    },
  ];

  nextId = 6;
  nextEventId = 9;
}

export const handlers = [
  http.get("/api/merchants", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    let result = mockMerchants;
    if (status) {
      result = result.filter((m) => m.status === status);
    }

    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("page_size") ?? "20");
    const start = (page - 1) * pageSize;
    const results = result.slice(start, start + pageSize);
    const count = result.length;
    const nextUrl = new URL(url);
    nextUrl.searchParams.set("page", String(page + 1));
    const previousUrl = new URL(url);
    previousUrl.searchParams.set("page", String(page - 1));

    return HttpResponse.json({
      count,
      next: start + pageSize < count ? nextUrl.toString() : null,
      previous: page > 1 ? previousUrl.toString() : null,
      results,
    });
  }),

  http.get("/api/merchants/:id", ({ params }) => {
    const id = Number(params.id);
    const merchant = mockMerchants.find((m) => m.id === id);

    if (!merchant) {
      return HttpResponse.json({ detail: "Não encontrado." }, { status: 404 });
    }

    return HttpResponse.json(merchant);
  }),

  http.patch("/api/merchants/:id", async ({ params, request }) => {
    const id = Number(params.id);
    const merchant = mockMerchants.find((m) => m.id === id);

    if (!merchant) {
      return HttpResponse.json({ detail: "Não encontrado." }, { status: 404 });
    }

    if (merchant.status !== "draft") {
      return HttpResponse.json(
        {
          status: [
            "Merchant registration data can only be updated while in draft.",
          ],
        },
        { status: 422 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const updated = { ...merchant };

    if (typeof body.cnpj === "string") updated.cnpj = body.cnpj;
    if (typeof body.legal_name === "string")
      updated.legal_name = body.legal_name;
    if (typeof body.trade_name === "string")
      updated.trade_name = body.trade_name;
    if (typeof body.contact_email === "string")
      updated.contact_email = body.contact_email;
    if (typeof body.phone === "string") updated.phone = body.phone;

    Object.assign(merchant, updated);

    return HttpResponse.json(updated);
  }),

  http.post("/api/merchants/", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    if (!body.cnpj || !body.legal_name || !body.contact_email) {
      const errors: Record<string, string[]> = {};
      if (!body.cnpj) errors.cnpj = ["CNPJ é obrigatório"];
      if (!body.legal_name) errors.legal_name = ["Razão social é obrigatória"];
      if (!body.contact_email) errors.contact_email = ["E-mail é obrigatório"];
      return HttpResponse.json(errors, { status: 422 });
    }

    if (body.cnpj === "12345678000195") {
      return HttpResponse.json(
        { cnpj: ["Já existe um merchant com esse CNPJ."] },
        { status: 422 },
      );
    }

    const newMerchant: Merchant = {
      id: nextId++,
      cnpj: body.cnpj as string,
      legal_name: body.legal_name as string,
      trade_name: (body.trade_name as string) ?? "",
      contact_email: body.contact_email as string,
      phone: (body.phone as string) ?? "",
      created_at: new Date().toISOString(),
      status: "draft",
    };

    mockMerchants.push(newMerchant);

    return HttpResponse.json(newMerchant, { status: 201 });
  }),

  http.post("/api/merchants/:id/submit-for-analysis", ({ params }) => {
    const id = Number(params.id);
    const merchant = mockMerchants.find((m) => m.id === id);

    if (!merchant) {
      return HttpResponse.json({ detail: "Não encontrado." }, { status: 404 });
    }

    if (merchant.status !== "draft") {
      return HttpResponse.json(
        { status: ["Merchant can only be submitted for analysis from draft."] },
        { status: 422 },
      );
    }

    merchant.status = "pending_analysis";
    (mockTimeline[id] ??= []).push({
      id: nextEventId++,
      message: "Merchant enviado para análise",
      created_at: new Date().toISOString(),
    });

    return HttpResponse.json({ ...merchant });
  }),

  http.post("/api/merchants/:id/approve", ({ params }) => {
    const id = Number(params.id);
    const merchant = mockMerchants.find((m) => m.id === id);

    if (!merchant) {
      return HttpResponse.json({ detail: "Não encontrado." }, { status: 404 });
    }

    if (merchant.status !== "pending_analysis") {
      return HttpResponse.json(
        { status: ["Merchant can only be approved from pending_analysis."] },
        { status: 422 },
      );
    }

    merchant.status = "approved";
    (mockTimeline[id] ??= []).push({
      id: nextEventId++,
      message: "Merchant aprovado",
      created_at: new Date().toISOString(),
    });

    return HttpResponse.json({ ...merchant });
  }),

  http.post("/api/merchants/:id/reject", async ({ params, request }) => {
    const id = Number(params.id);
    const merchant = mockMerchants.find((m) => m.id === id);
    const body = (await request.json()) as { reason?: string };

    if (!merchant) {
      return HttpResponse.json({ detail: "Não encontrado." }, { status: 404 });
    }

    if (merchant.status !== "pending_analysis") {
      return HttpResponse.json(
        { status: ["Merchant can only be rejected from pending_analysis."] },
        { status: 422 },
      );
    }

    merchant.status = "rejected";
    (mockTimeline[id] ??= []).push({
      id: nextEventId++,
      message: `Merchant rejeitado: ${body.reason ?? ""}`,
      created_at: new Date().toISOString(),
    });

    return HttpResponse.json({ ...merchant });
  }),

  http.post("/api/merchants/:id/block", async ({ params, request }) => {
    const id = Number(params.id);
    const merchant = mockMerchants.find((m) => m.id === id);
    const body = (await request.json()) as { reason?: string };

    if (!merchant) {
      return HttpResponse.json({ detail: "Não encontrado." }, { status: 404 });
    }

    if (merchant.status !== "approved") {
      return HttpResponse.json(
        { status: ["Merchant can only be blocked from approved."] },
        { status: 422 },
      );
    }

    merchant.status = "blocked";
    (mockTimeline[id] ??= []).push({
      id: nextEventId++,
      message: `Merchant bloqueado: ${body.reason ?? ""}`,
      created_at: new Date().toISOString(),
    });

    return HttpResponse.json({ ...merchant });
  }),

  http.post("/api/merchants/:id/reopen", async ({ params, request }) => {
    const id = Number(params.id);
    const merchant = mockMerchants.find((m) => m.id === id);
    const body = (await request.json()) as { reason?: string };

    if (!merchant) {
      return HttpResponse.json({ detail: "Não encontrado." }, { status: 404 });
    }

    if (merchant.status !== "rejected") {
      return HttpResponse.json(
        { status: ["Merchant só pode ser reaberto quando estiver rejeitado."] },
        { status: 422 },
      );
    }

    merchant.status = "draft";
    (mockTimeline[id] ??= []).push({
      id: nextEventId++,
      message: `Merchant reaberto: ${body.reason ?? ""}`,
      created_at: new Date().toISOString(),
    });

    return HttpResponse.json({ ...merchant });
  }),

  http.post("/api/merchants/:id/unblock", async ({ params, request }) => {
    const id = Number(params.id);
    const merchant = mockMerchants.find((m) => m.id === id);
    const body = (await request.json()) as { reason?: string };

    if (!merchant) {
      return HttpResponse.json({ detail: "Não encontrado." }, { status: 404 });
    }

    if (merchant.status !== "blocked") {
      return HttpResponse.json(
        {
          status: [
            "Merchant só pode ser desbloqueado quando estiver bloqueado.",
          ],
        },
        { status: 422 },
      );
    }

    merchant.status = "approved";
    (mockTimeline[id] ??= []).push({
      id: nextEventId++,
      message: `Merchant desbloqueado: ${body.reason ?? ""}`,
      created_at: new Date().toISOString(),
    });

    return HttpResponse.json({ ...merchant });
  }),

  http.get("/api/merchants/:id/timeline", ({ params }) => {
    const id = Number(params.id);
    const events = mockTimeline[id] ?? [];

    return HttpResponse.json(events);
  }),
];
