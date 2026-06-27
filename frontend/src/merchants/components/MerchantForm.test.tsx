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

  it("calls onSubmit with normalized numeric CNPJ when form is valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<MerchantForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("CNPJ"), "11.222.333/0001-81");
    await user.type(
      screen.getByLabelText("Razão Social"),
      "Empresa Teste Ltda",
    );
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

  it("calls onSubmit with normalized alphanumeric CNPJ when form is valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<MerchantForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("CNPJ"), "ab.345.678/000b-72");
    await user.type(
      screen.getByLabelText("Razão Social"),
      "Empresa Teste Ltda",
    );
    await user.type(screen.getByLabelText("E-mail"), "teste@teste.com");

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        cnpj: "AB345678000B72",
        legal_name: "Empresa Teste Ltda",
        contact_email: "teste@teste.com",
      }),
    );
  });

  it("shows validation error for alphanumeric CNPJ with invalid check digits", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<MerchantForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("CNPJ"), "ab.345.678/000b-71");
    await user.type(
      screen.getByLabelText("Razão Social"),
      "Empresa Teste Ltda",
    );
    await user.type(screen.getByLabelText("E-mail"), "teste@teste.com");

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByText("CNPJ inválido")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows server errors when passed", () => {
    render(
      <MerchantForm
        onSubmit={vi.fn()}
        serverErrors={{ cnpj: "Já existe um merchant com esse CNPJ." }}
      />,
    );

    expect(
      screen.getByText("Já existe um merchant com esse CNPJ."),
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

  it("renders alphanumeric CNPJ with formatted display", async () => {
    const user = userEvent.setup();
    render(<MerchantForm onSubmit={vi.fn()} />);

    const cnpjInput = screen.getByLabelText("CNPJ");
    await user.type(cnpjInput, "ab345678000b72");

    expect(cnpjInput).toHaveValue("AB.345.678/000B-72");
  });

  it("renders phone with fixo mask as user types 10 digits", async () => {
    const user = userEvent.setup();
    render(<MerchantForm onSubmit={vi.fn()} />);

    const phoneInput = screen.getByLabelText("Telefone");
    await user.type(phoneInput, "1191234567");

    expect(phoneInput).toHaveValue("(11) 9123-4567");
  });

  it("renders phone with movel mask as user types 11 digits", async () => {
    const user = userEvent.setup();
    render(<MerchantForm onSubmit={vi.fn()} />);

    const phoneInput = screen.getByLabelText("Telefone");
    await user.type(phoneInput, "11991234567");

    expect(phoneInput).toHaveValue("(11) 99123-4567");
  });

  it("strips non-digits from phone and submits digits-only", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<MerchantForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("CNPJ"), "11222333000181");
    await user.type(
      screen.getByLabelText("Razão Social"),
      "Empresa Teste Ltda",
    );
    await user.type(screen.getByLabelText("E-mail"), "teste@teste.com");
    await user.type(screen.getByLabelText("Telefone"), "11991234567");

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: "11991234567",
      }),
    );
  });

  it("prefills phone with formatted display from defaultValues", () => {
    render(
      <MerchantForm
        onSubmit={vi.fn()}
        defaultValues={{ phone: "11991234567" }}
      />,
    );

    expect(screen.getByLabelText("Telefone")).toHaveValue("(11) 99123-4567");
  });
});
