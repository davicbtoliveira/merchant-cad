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

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
