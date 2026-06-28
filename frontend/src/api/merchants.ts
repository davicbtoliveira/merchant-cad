import type { Merchant, PaginatedResponse, TimelineEvent } from "../types/merchant";

const BASE_URL = "/api/merchants";

export async function fetchMerchants(
  status?: string | null,
): Promise<Merchant[]> {
  const url = status
    ? `${BASE_URL}/?status=${encodeURIComponent(status)}`
    : `${BASE_URL}/`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Erro ao carregar merchants");
  }

  const body = (await response.json()) as PaginatedResponse<Merchant>;
  return body.results;
}

export async function fetchMerchant(id: number): Promise<Merchant> {
  const response = await fetch(`${BASE_URL}/${id}/`);

  if (response.status === 404) {
    throw new Error("Merchant não encontrado");
  }

  if (!response.ok) {
    throw new Error("Erro ao carregar merchant");
  }

  return response.json();
}

export async function fetchTimeline(id: number): Promise<TimelineEvent[]> {
  const response = await fetch(`${BASE_URL}/${id}/timeline/`);

  if (!response.ok) {
    throw new Error("Erro ao carregar timeline");
  }

  return response.json();
}

export async function createMerchant(
  data: Omit<Merchant, "id" | "created_at" | "status">,
): Promise<Merchant> {
  const response = await fetch(BASE_URL + "/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error = new Error("Erro ao criar merchant") as Error & {
      status: number;
      body: unknown;
    };
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return response.json();
}

export async function updateMerchant(
  id: number,
  data: Partial<Omit<Merchant, "id" | "created_at" | "status">>,
): Promise<Merchant> {
  const response = await fetch(`${BASE_URL}/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (response.status === 404) {
    throw new Error("Merchant não encontrado");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error = new Error("Erro ao atualizar merchant") as Error & {
      status: number;
      body: unknown;
    };
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return response.json();
}

export async function statusTransition(
  merchantId: number,
  action: string,
  body?: Record<string, unknown>,
): Promise<Merchant> {
  const response = await fetch(`${BASE_URL}/${merchantId}/${action}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const responseBody = await response.json().catch(() => null);
    const error = new Error("Erro na transição de status") as Error & {
      status: number;
      body: unknown;
    };
    error.status = response.status;
    error.body = responseBody;
    throw error;
  }

  return response.json();
}
