import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
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
});
