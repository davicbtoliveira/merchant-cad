import { describe, expect, it } from "vitest";
import { formatCnpjDisplay, normalizeCnpjInput } from "./cnpj";

describe("cnpj utils", () => {
  it("formats numeric CNPJ", () => {
    expect(formatCnpjDisplay("11222333000181")).toBe("11.222.333/0001-81");
  });

  it("formats alphanumeric CNPJ", () => {
    expect(formatCnpjDisplay("AB345678000B72")).toBe("AB.345.678/000B-72");
  });

  it("normalizes punctuation and lowercase letters", () => {
    expect(normalizeCnpjInput("ab.345.678/000b-72")).toBe("AB345678000B72");
  });
});
