import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it } from "vitest";
import { resetMockData } from "../../mocks/handlers";
import { MerchantDetailPage } from "./MerchantDetailPage";

function renderDetailPage(merchantId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/merchants/${merchantId}`]}>
        <Routes>
          <Route path="/merchants/:id" element={<MerchantDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("MerchantDetailPage", () => {
  beforeEach(() => {
    resetMockData();
  });
  it("loads and displays merchant data", async () => {
    renderDetailPage("2");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Comércio ABC S.A." })).toBeInTheDocument();
    });

    expect(screen.getByText("Aprovado")).toBeInTheDocument();
    expect(screen.getByText("abc@comercio.com")).toBeInTheDocument();
    expect(screen.getByText(/ABC Comércio/)).toBeInTheDocument();
  });

  it("loads and displays timeline", async () => {
    renderDetailPage("2");

    await waitFor(() => {
      expect(screen.getByText("Merchant criado")).toBeInTheDocument();
    });

    expect(screen.getByText("Merchant enviado para análise")).toBeInTheDocument();
    expect(screen.getByText("Merchant aprovado")).toBeInTheDocument();
  });

  it("shows 404 message when merchant does not exist", async () => {
    renderDetailPage("999");

    await waitFor(() => {
      expect(
        screen.getByText("Merchant não encontrado."),
      ).toBeInTheDocument();
    });
  });

  describe("status transitions", () => {
    it("submits draft for analysis and updates to pending_analysis", async () => {
      const user = userEvent.setup();
      renderDetailPage("1");

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Enviar para análise" }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Enviar para análise" }));

      await waitFor(() => {
        expect(screen.getByText("Em análise")).toBeInTheDocument();
      });
    });

    it("approves pending_analysis merchant", async () => {
      const user = userEvent.setup();
      renderDetailPage("3");

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Aprovar" }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Aprovar" }));

      await waitFor(() => {
        expect(screen.getByText("Aprovado")).toBeInTheDocument();
      });
    });

    it("rejects pending_analysis merchant with reason", async () => {
      const user = userEvent.setup();
      renderDetailPage("3");

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Rejeitar" }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Rejeitar" }));
      await user.type(
        screen.getByPlaceholderText("Motivo (obrigatório)"),
        "Documentação incompleta",
      );
      await user.click(screen.getByRole("button", { name: "Confirmar" }));

      await waitFor(() => {
        expect(screen.getByText("Rejeitado")).toBeInTheDocument();
      });
    });

    it("blocks approved merchant with reason", async () => {
      const user = userEvent.setup();
      renderDetailPage("2");

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Bloquear" }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Bloquear" }));
      await user.type(
        screen.getByPlaceholderText("Motivo (obrigatório)"),
        "Atividade suspeita",
      );
      await user.click(screen.getByRole("button", { name: "Confirmar" }));

      await waitFor(() => {
        expect(screen.getByText("Bloqueado")).toBeInTheDocument();
      });
    });


  });
});
