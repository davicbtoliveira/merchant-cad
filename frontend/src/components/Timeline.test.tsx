import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { MerchantTimeline } from "./Timeline";

function renderTimeline(merchantId: number) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MerchantTimeline merchantId={merchantId} />
    </QueryClientProvider>,
  );
}

describe("MerchantTimeline", () => {
  it("renders events in chronological order", async () => {
    renderTimeline(2);

    expect(await screen.findByText("Merchant criado")).toBeInTheDocument();
    expect(screen.getByText("Merchant enviado para análise")).toBeInTheDocument();
    expect(screen.getByText("Merchant aprovado")).toBeInTheDocument();
  });

  it("renders message correctly", async () => {
    renderTimeline(2);

    expect(await screen.findByText("Merchant aprovado")).toBeInTheDocument();
  });

  it("shows empty state when there are no events", async () => {
    renderTimeline(1);

    expect(
      await screen.findByText("Nenhum evento registrado. Merchant recém-criado."),
    ).toBeInTheDocument();
  });

  it("displays readable date/time for events", async () => {
    renderTimeline(2);

    expect(
      await screen.findByText((content) => content.startsWith("15/06/2026")),
    ).toBeInTheDocument();
  });
});
