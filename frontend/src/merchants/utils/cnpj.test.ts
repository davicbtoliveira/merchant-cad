import { describe, expect, it } from "vitest";
import { formatCnpjDisplay, isValidCnpj, normalizeCnpjInput } from "./cnpj";

describe("cnpj utils", () => {
  it("formats numeric CNPJ", () => {
    expect(formatCnpjDisplay("11222333000181")).toBe("11.222.333/0001-81");
  });

  it("formats alphanumeric CNPJ", () => {
    expect(formatCnpjDisplay("AB345678000B72")).toBe("AB.345.678/000B-72");
  });

  it("formats alphanumeric CNPJ with numeric first character", () => {
    expect(formatCnpjDisplay("0NETF1OD000130")).toBe("0N.ETF.1OD/0001-30");
  });

  it("normalizes punctuation and lowercase letters", () => {
    expect(normalizeCnpjInput("ab.345.678/000b-72")).toBe("AB345678000B72");
  });

  it("validates numeric and alphanumeric CNPJ", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("ab.345.678/000b-72")).toBe(true);
    expect(isValidCnpj("0N.ETF.1OD/0001-30")).toBe(true);
  });

  it("rejects invalid CNPJ", () => {
    expect(isValidCnpj("AB345678000B71")).toBe(false);
    expect(isValidCnpj("AB345678000B7A")).toBe(false);
    expect(isValidCnpj("AB345678000B72X")).toBe(false);
    expect(isValidCnpj("AB345678000@B72")).toBe(false);
    expect(isValidCnpj("00000000000000")).toBe(false);
  });
});
