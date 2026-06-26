import { test, expect } from "@playwright/test";

test.describe("Merchant full flow", () => {
  function makeUniqueCnpj(prefix: string) {
  const ts = Date.now().toString().slice(-8);
  const digits = `${prefix}${ts.padEnd(12, "0").slice(0, 12)}`;
  const base12 = digits.slice(0, 12);
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const dv = (base: string, weights: number[]) => {
    const total = base
      .split("")
      .reduce((sum, c, i) => sum + (c.charCodeAt(0) - 48) * weights[i], 0);
    const r = total % 11;
    return r < 2 ? "0" : String(11 - r);
  };
  const d1 = dv(base12, w1);
  const d2 = dv(base12 + d1, w2);
  const cnpj = `${base12}${d1}${d2}`;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
}

  const uniqueId = Date.now().toString().slice(-6);
  const cnpj = makeUniqueCnpj("12");
  const legalName = `Empresa Teste E2E ${uniqueId}`;
  const tradeName = `Teste ${uniqueId}`;
  const email = `teste${uniqueId}@example.com`;
  const phone = "11999999999";
  const editedName = `${legalName} Editada`;

  test("full flow: create, edit, submit, approve, block", async ({ page }) => {
    await page.goto("/merchants");
    await expect(page.getByText("Merchants")).toBeVisible();

    await page.getByRole("button", { name: "Novo" }).click();
    await expect(page).toHaveURL(/\/merchants\/new/);

    await page.getByLabel("CNPJ").fill(cnpj);
    await page.getByLabel("Razão Social").fill(legalName);
    await page.getByLabel("Nome Fantasia").fill(tradeName);
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Telefone").fill(phone);

    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page).toHaveURL(/\/merchants\/\d+/);
    await expect(page.getByRole("heading", { name: legalName })).toBeVisible();
    await expect(page.getByText("Rascunho", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Editar" }).click();
    await expect(page).toHaveURL(/\/merchants\/\d+\/edit/);

    const nameInput = page.getByLabel("Razão Social");
    await nameInput.clear();
    await nameInput.fill(editedName);
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page).toHaveURL(/\/merchants\/\d+/);
    await expect(page.getByRole("heading", { name: editedName })).toBeVisible();

    await page.getByRole("button", { name: "Enviar para análise" }).click();
    await expect(page.getByText("Em análise", { exact: true })).toBeVisible();
    await expect(page.getByText("Merchant enviado para análise")).toBeVisible();

    await page.getByRole("button", { name: "Aprovar" }).click();
    await expect(page.getByText("Aprovado", { exact: true })).toBeVisible();
    await expect(page.getByText("Merchant aprovado")).toBeVisible();

    await page.getByRole("button", { name: "Bloquear" }).click();
    await page.getByPlaceholder("Motivo (obrigatório)").fill("Atividade suspeita");
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByText("Bloqueado", { exact: true })).toBeVisible();
    await expect(page.getByText("Merchant bloqueado: Atividade suspeita")).toBeVisible();

    await page.getByRole("button", { name: /Voltar/i }).click();
    await expect(page).toHaveURL(/\/merchants$/);
    await expect(page.getByRole("cell", { name: editedName })).toBeVisible();
  });

  test("reject merchant with reason", async ({ page }) => {
    const rejectId = Date.now().toString().slice(-5);
    const rejectCnpj = makeUniqueCnpj("34");
    const rejectName = `Empresa Rejeitada ${rejectId}`;

    await page.goto("/merchants/new");
    await page.getByLabel("CNPJ").fill(rejectCnpj);
    await page.getByLabel("Razão Social").fill(rejectName);
    await page.getByLabel("E-mail").fill(`rejeitado${rejectId}@example.com`);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/merchants\/\d+/);

    await page.getByRole("button", { name: "Enviar para análise" }).click();
    await expect(page.getByText("Em análise", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Rejeitar" }).click();
    await page.getByPlaceholder("Motivo (obrigatório)").fill("Documentação incompleta");
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByText("Rejeitado", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Merchant rejeitado: Documentação incompleta"),
    ).toBeVisible();
  });

  test("edit blocked for approved merchant shows 422 error", async ({ page }) => {
    const blockId = Date.now().toString().slice(-4);
    const blockCnpj = makeUniqueCnpj("56");
    const blockName = `Empresa Bloqueada ${blockId}`;

    await page.goto("/merchants/new");
    await page.getByLabel("CNPJ").fill(blockCnpj);
    await page.getByLabel("Razão Social").fill(blockName);
    await page.getByLabel("E-mail").fill(`bloqueada${blockId}@example.com`);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/merchants\/\d+/);

    await page.getByRole("button", { name: "Enviar para análise" }).click();
    await expect(page.getByText("Em análise", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Aprovar" }).click();
    await expect(page.getByText("Aprovado", { exact: true })).toBeVisible();

    const url = page.url();
    await page.goto(`${url}/edit`);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText(/only be updated while in draft/i)).toBeVisible({ timeout: 10000 });
  });
});
