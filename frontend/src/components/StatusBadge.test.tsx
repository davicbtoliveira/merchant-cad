import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MerchantStatusBadge } from "./StatusBadge";

describe("MerchantStatusBadge", () => {
  it("renders draft status with correct text", () => {
    render(<MerchantStatusBadge status="draft" />);
    expect(screen.getByText("Rascunho")).toBeInTheDocument();
  });

  it("renders pending_analysis status with correct text", () => {
    render(<MerchantStatusBadge status="pending_analysis" />);
    expect(screen.getByText("Em análise")).toBeInTheDocument();
  });

  it("renders approved status with correct text", () => {
    render(<MerchantStatusBadge status="approved" />);
    expect(screen.getByText("Aprovado")).toBeInTheDocument();
  });

  it("renders rejected status with correct text", () => {
    render(<MerchantStatusBadge status="rejected" />);
    expect(screen.getByText("Rejeitado")).toBeInTheDocument();
  });

  it("renders blocked status with correct text", () => {
    render(<MerchantStatusBadge status="blocked" />);
    expect(screen.getByText("Bloqueado")).toBeInTheDocument();
  });
});
