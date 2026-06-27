import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import type { Merchant } from "../api/merchants";
import { MerchantTable } from "./MerchantTable";

const mockMerchants: Merchant[] = [
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
    cnpj: "12345678000276",
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
    legal_name: "Empresa Alpha Ltda",
    trade_name: "Alpha",
    contact_email: "alpha@empresa.com",
    phone: "11777777777",
    created_at: "2026-06-16T10:00:00Z",
    status: "draft",
  },
];

describe("MerchantTable", () => {
  it("renders merchant rows from a list", () => {
    render(
      <MemoryRouter>
        <MerchantTable merchants={mockMerchants} isLoading={false} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Empresa Exemplo Ltda")).toBeInTheDocument();
    expect(screen.getByText("Comércio ABC S.A.")).toBeInTheDocument();
    expect(screen.getByText("0N.ETF.1OD/0001-30")).toBeInTheDocument();
  });

  it("renders empty state when list is empty", () => {
    render(
      <MemoryRouter>
        <MerchantTable merchants={[]} isLoading={false} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Nenhum merchant encontrado.")).toBeInTheDocument();
  });

  it("shows spinner while loading", () => {
    render(
      <MemoryRouter>
        <MerchantTable merchants={[]} isLoading={true} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status", { name: "Carregando" })).toBeInTheDocument();
  });
});
