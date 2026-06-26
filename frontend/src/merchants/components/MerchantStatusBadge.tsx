import type { MerchantStatus } from "../api/merchants";

const statusConfig: Record<
  MerchantStatus,
  { label: string; className: string }
> = {
  draft: { label: "Rascunho", className: "bg-gray-100 text-gray-800" },
  pending_analysis: {
    label: "Em análise",
    className: "bg-yellow-100 text-yellow-800",
  },
  approved: { label: "Aprovado", className: "bg-green-100 text-green-800" },
  rejected: { label: "Rejeitado", className: "bg-red-100 text-red-800" },
  blocked: { label: "Bloqueado", className: "bg-gray-900 text-white" },
};

interface MerchantStatusBadgeProps {
  status: MerchantStatus;
}

export function MerchantStatusBadge({ status }: MerchantStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
