import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCnpjDisplay } from "../utils/cnpj";

export type MerchantStatus =
  | "draft"
  | "pending_analysis"
  | "approved"
  | "rejected"
  | "blocked";

export interface Merchant {
  id: number;
  cnpj: string;
  legal_name: string;
  trade_name: string;
  contact_email: string;
  phone: string;
  created_at: string;
  status: MerchantStatus;
}

export interface TimelineEvent {
  id: number;
  message: string;
  created_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

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

export function useMerchants(status?: string | null) {
  return useQuery({
    queryKey: ["merchants", status],
    queryFn: () => fetchMerchants(status),
  });
}

export function useMerchant(id: number) {
  return useQuery({
    queryKey: ["merchant", id],
    queryFn: () => fetchMerchant(id),
    enabled: !Number.isNaN(id),
  });
}

export function useTimeline(id: number) {
  return useQuery({
    queryKey: ["timeline", id],
    queryFn: () => fetchTimeline(id),
    enabled: !Number.isNaN(id),
  });
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

export function useCreateMerchant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMerchant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchants"] });
    },
  });
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

export function useUpdateMerchant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateMerchant>[1] }) =>
      updateMerchant(id, data),
    onSuccess: (merchant) => {
      queryClient.invalidateQueries({ queryKey: ["merchants"] });
      queryClient.invalidateQueries({ queryKey: ["merchant", merchant.id] });
    },
  });
}

async function statusTransition(
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

function useStatusTransition(action: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      merchantId,
      reason,
    }: {
      merchantId: number;
      reason?: string;
    }) => {
      const body = reason ? { reason } : undefined;
      return statusTransition(merchantId, action, body);
    },
    onSuccess: (merchant) => {
      queryClient.invalidateQueries({ queryKey: ["merchants"] });
      queryClient.invalidateQueries({ queryKey: ["merchant", merchant.id] });
      queryClient.invalidateQueries({ queryKey: ["timeline", merchant.id] });
    },
  });
}

export function useSubmitForAnalysis() {
  return useStatusTransition("submit-for-analysis");
}

export function useApproveMerchant() {
  return useStatusTransition("approve");
}

export function useRejectMerchant() {
  return useStatusTransition("reject");
}

export function useBlockMerchant() {
  return useStatusTransition("block");
}

export function useReopenMerchant() {
  return useStatusTransition("reopen");
}

export function useUnblockMerchant() {
  return useStatusTransition("unblock");
}

export function formatCnpj(cnpj: string): string {
  return formatCnpjDisplay(cnpj);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
