import { http, HttpResponse } from "msw";
import type { Merchant } from "../merchants/api/merchants";

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
];
