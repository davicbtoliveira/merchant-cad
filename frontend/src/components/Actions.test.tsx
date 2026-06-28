import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import type { Merchant } from "../types/merchant";
import { MerchantActions } from "./Actions";

function renderActions(merchant: Merchant) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MerchantActions merchant={merchant} />
    </QueryClientProvider>,
  );
}

const draftMerchant: Merchant = {
  id: 1,
  cnpj: "11222333000181",
  legal_name: "Empresa Teste Ltda",
  trade_name: "Teste",
  contact_email: "teste@teste.com",
  phone: "11999999999",
  created_at: "2026-06-01T10:00:00Z",
  status: "draft",
};

const pendingMerchant: Merchant = {
  ...draftMerchant,
  id: 2,
  status: "pending_analysis",
};

const approvedMerchant: Merchant = {
  ...draftMerchant,
  id: 3,
  status: "approved",
};

const rejectedMerchant: Merchant = {
  ...draftMerchant,
  id: 4,
  status: "rejected",
};

const blockedMerchant: Merchant = {
  ...draftMerchant,
  id: 5,
  status: "blocked",
};

describe("MerchantActions", () => {
  it("shows Enviar para análise button only for draft", () => {
    renderActions(draftMerchant);
    expect(
      screen.getByRole("button", { name: "Enviar para análise" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Aprovar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Rejeitar" }),
    ).not.toBeInTheDocument();
  });

  it("shows Aprovar and Rejeitar only for pending_analysis", () => {
    renderActions(pendingMerchant);
    expect(
      screen.getByRole("button", { name: "Aprovar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rejeitar" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Enviar para análise" }),
    ).not.toBeInTheDocument();
  });

  it("shows Bloquear only for approved", () => {
    renderActions(approvedMerchant);
    expect(
      screen.getByRole("button", { name: "Bloquear" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Aprovar" }),
    ).not.toBeInTheDocument();
  });

  it("shows Reabrir only for rejected", () => {
    renderActions(rejectedMerchant);
    expect(
      screen.queryByRole("button", { name: "Enviar para análise" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Aprovar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Rejeitar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Bloquear" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Desbloquear" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reabrir" }),
    ).toBeInTheDocument();
  });

  it("shows Desbloquear only for blocked", () => {
    renderActions(blockedMerchant);
    expect(
      screen.queryByRole("button", { name: "Enviar para análise" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Aprovar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Rejeitar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Bloquear" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reabrir" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Desbloquear" }),
    ).toBeInTheDocument();
  });

  it("opens reason dialog when clicking Rejeitar", async () => {
    const user = userEvent.setup();
    renderActions(pendingMerchant);

    await user.click(screen.getByRole("button", { name: "Rejeitar" }));

    expect(screen.getByText("Rejeitar Merchant")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
  });

  it("opens reason dialog when clicking Bloquear", async () => {
    const user = userEvent.setup();
    renderActions(approvedMerchant);

    await user.click(screen.getByRole("button", { name: "Bloquear" }));

    expect(screen.getByText("Bloquear Merchant")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
  });

  it("opens reason dialog when clicking Reabrir", async () => {
    const user = userEvent.setup();
    renderActions(rejectedMerchant);

    await user.click(screen.getByRole("button", { name: "Reabrir" }));

    expect(screen.getByText("Reabrir Merchant")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
  });

  it("opens reason dialog when clicking Desbloquear", async () => {
    const user = userEvent.setup();
    renderActions(blockedMerchant);

    await user.click(screen.getByRole("button", { name: "Desbloquear" }));

    expect(screen.getByText("Desbloquear Merchant")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
  });

  it("disables Confirmar button when reason is empty", async () => {
    const user = userEvent.setup();
    renderActions(pendingMerchant);

    await user.click(screen.getByRole("button", { name: "Rejeitar" }));

    expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText("Motivo (obrigatório)"),
      "Motivo válido",
    );

    expect(screen.getByRole("button", { name: "Confirmar" })).toBeEnabled();
  });
});
