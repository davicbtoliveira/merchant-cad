import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { MerchantNewPage } from "./MerchantNewPage";

function renderNewPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/merchants/new"]}>
        <Routes>
          <Route path="/merchants/new" element={<MerchantNewPage />} />
          <Route
            path="/merchants/:id"
            element={<div>Merchant Detail Page</div>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("MerchantNewPage", () => {
  it("renders the form with all fields", () => {
    renderNewPage();

    expect(screen.getByText("Novo Merchant")).toBeInTheDocument();
    expect(screen.getByLabelText("CNPJ")).toBeInTheDocument();
    expect(screen.getByLabelText("Razão Social")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });

  it("creates merchant and redirects to detail page on success", async () => {
    const user = userEvent.setup();
    renderNewPage();

    await user.type(screen.getByLabelText("CNPJ"), "11222333000181");
    await user.type(
      screen.getByLabelText("Razão Social"),
      "Empresa Teste Ltda",
    );
    await user.type(screen.getByLabelText("E-mail"), "teste@teste.com");

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(screen.getByText("Merchant Detail Page")).toBeInTheDocument();
    });
  });

  it("shows error 422 inline when backend rejects", async () => {
    const user = userEvent.setup();
    renderNewPage();

    await user.type(screen.getByLabelText("CNPJ"), "12345678000195");
    await user.type(
      screen.getByLabelText("Razão Social"),
      "Empresa Teste Ltda",
    );
    await user.type(screen.getByLabelText("E-mail"), "teste@teste.com");

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(
        screen.getByText("Já existe um merchant com esse CNPJ."),
      ).toBeInTheDocument();
    });
  });
});
