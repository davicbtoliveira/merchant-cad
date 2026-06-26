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
    cnpj: "55666777000199",
    legal_name: "Comércio ABC S.A.",
    trade_name: "ABC Comércio",
    contact_email: "abc@comercio.com",
    phone: "11888888888",
    created_at: "2026-06-15T14:30:00Z",
    status: "approved",
  },
  {
    id: 3,
    cnpj: "99888777000111",
    legal_name: "Serviços XYZ Ltda",
    trade_name: "XYZ Serviços",
    contact_email: "contato@xyz.com",
    phone: "11777777777",
    created_at: "2026-06-20T09:00:00Z",
    status: "pending_analysis",
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
};

let nextId = 4;

export const handlers = [
  http.get("/api/merchants", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    let result = mockMerchants;
    if (status) {
      result = result.filter((m) => m.status === status);
    }

    return HttpResponse.json(result);
  }),

  http.get("/api/merchants/:id", ({ params }) => {
    const id = Number(params.id);
    const merchant = mockMerchants.find((m) => m.id === id);

    if (!merchant) {
      return HttpResponse.json({ detail: "Não encontrado." }, { status: 404 });
    }

    return HttpResponse.json(merchant);
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

    if (body.cnpj === "00000000000000") {
      return HttpResponse.json(
        { cnpj: ["Merchant with this CNPJ already exists."] },
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

  http.get("/api/merchants/:id/timeline", ({ params }) => {
    const id = Number(params.id);
    const events = mockTimeline[id] ?? [];

    return HttpResponse.json(events);
  }),
];
