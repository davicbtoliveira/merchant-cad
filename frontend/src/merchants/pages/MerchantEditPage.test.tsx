import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { MerchantEditPage } from "./MerchantEditPage";

function renderEditPage(merchantId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/merchants/${merchantId}/edit`]}>
        <Routes>
          <Route path="/merchants/:id/edit" element={<MerchantEditPage />} />
          <Route path="/merchants/:id" element={<div>Merchant Detail Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("MerchantEditPage", () => {
  it("loads existing merchant data into the form", async () => {
    renderEditPage("1");

    await waitFor(() => {
      const cnpj = screen.getByLabelText("CNPJ") as HTMLInputElement;
      expect(cnpj.value).toBe("11.222.333/0001-81");
    });

    const legalName = screen.getByLabelText("Razão Social") as HTMLInputElement;
    expect(legalName.value).toBe("Empresa Exemplo Ltda");
  });

  it("saves changes and redirects to detail page", async () => {
    const user = userEvent.setup();
    renderEditPage("1");

    await waitFor(() => {
      expect(screen.getByLabelText("Razão Social")).toBeInTheDocument();
    });

    const legalName = screen.getByLabelText("Razão Social");
    await user.clear(legalName);
    await user.type(legalName, "Empresa Editada Ltda");

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(screen.getByText("Merchant Detail Page")).toBeInTheDocument();
    });
  });

  it("shows error 422 when merchant is not in draft", async () => {
    const user = userEvent.setup();
    renderEditPage("2");

    await waitFor(() => {
      expect(screen.getByLabelText("Razão Social")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(
        screen.getByText("Merchant registration data can only be updated while in draft."),
      ).toBeInTheDocument();
    });
  });

  it("shows 404 when merchant does not exist", async () => {
    renderEditPage("999");

    await waitFor(() => {
      expect(
        screen.getByText("Merchant não encontrado."),
      ).toBeInTheDocument();
    });
  });
});
