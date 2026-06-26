import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { MerchantListPage } from "./MerchantListPage";

function renderPage(initialRoute = "/merchants") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/merchants" element={<MerchantListPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("MerchantListPage", () => {
  it("fetches and displays merchants", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Empresa Exemplo Ltda")).toBeInTheDocument();
    });

    expect(screen.getByText("Comércio ABC S.A.")).toBeInTheDocument();
    expect(screen.getByText("Serviços XYZ Ltda")).toBeInTheDocument();
  });

  it("shows loading state during fetch", () => {
    renderPage();

    expect(screen.getByRole("status", { name: "Carregando" })).toBeInTheDocument();
  });

  it("filters by status when query param is present", async () => {
    renderPage("/merchants?status=approved");

    await waitFor(() => {
      expect(screen.getByText("Comércio ABC S.A.")).toBeInTheDocument();
    });

    expect(screen.queryByText("Empresa Exemplo Ltda")).not.toBeInTheDocument();
    expect(screen.queryByText("Serviços XYZ Ltda")).not.toBeInTheDocument();
  });

  it("updates URL when filter changes", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Empresa Exemplo Ltda")).toBeInTheDocument();
    });

    const select = screen.getByLabelText("Filtrar por status");
    await user.selectOptions(select, "draft");

    await waitFor(() => {
      expect(screen.getByText("Empresa Exemplo Ltda")).toBeInTheDocument();
    });

    expect(screen.queryByText("Comércio ABC S.A.")).not.toBeInTheDocument();
  });
});
