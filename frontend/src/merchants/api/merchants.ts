import { useQuery } from "@tanstack/react-query";

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

  return response.json();
}

export function useMerchants(status?: string | null) {
  return useQuery({
    queryKey: ["merchants", status],
    queryFn: () => fetchMerchants(status),
  });
}

export function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
