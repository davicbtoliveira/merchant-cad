import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MerchantForm } from "./MerchantForm";

describe("MerchantForm", () => {
  it("renders all form fields", () => {
    render(<MerchantForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("CNPJ")).toBeInTheDocument();
    expect(screen.getByLabelText("Razão Social")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome Fantasia")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Telefone")).toBeInTheDocument();
  });

  it("shows required validation errors on submit with empty fields", async () => {
    const user = userEvent.setup();
    render(<MerchantForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByText("CNPJ é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Razão social é obrigatória")).toBeInTheDocument();
    expect(screen.getByText("E-mail é obrigatório")).toBeInTheDocument();
  });

  it("calls onSubmit with stripped CNPJ digits when form is valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<MerchantForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("CNPJ"), "11.222.333/0001-81");
    await user.type(screen.getByLabelText("Razão Social"), "Empresa Teste Ltda");
    await user.type(screen.getByLabelText("E-mail"), "teste@teste.com");

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        cnpj: "11222333000181",
        legal_name: "Empresa Teste Ltda",
        contact_email: "teste@teste.com",
      }),
    );
  });

  it("shows server errors when passed", () => {
    render(
      <MerchantForm
        onSubmit={vi.fn()}
        serverErrors={{ cnpj: "Merchant with this CNPJ already exists." }}
      />,
    );

    expect(
      screen.getByText("Merchant with this CNPJ already exists."),
    ).toBeInTheDocument();
  });

  it("disables submit button while submitting", () => {
    render(<MerchantForm onSubmit={vi.fn()} isSubmitting={true} />);

    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
  });

  it("renders CNPJ with formatted display", async () => {
    const user = userEvent.setup();
    render(<MerchantForm onSubmit={vi.fn()} />);

    const cnpjInput = screen.getByLabelText("CNPJ");
    await user.type(cnpjInput, "11222333000181");

    expect(cnpjInput).toHaveValue("11.222.333/0001-81");
  });
});
