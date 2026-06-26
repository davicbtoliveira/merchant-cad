import { useNavigate } from "react-router";
import { Spinner } from "../../ui/Spinner";
import { formatCnpj, formatDate, type Merchant } from "../api/merchants";
import { MerchantStatusBadge } from "./MerchantStatusBadge";

interface MerchantTableProps {
  merchants: Merchant[];
  isLoading: boolean;
}

export function MerchantTable({ merchants, isLoading }: MerchantTableProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <Spinner size="lg" />;
  }

  if (merchants.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-500">Nenhum merchant encontrado.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              CNPJ
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Razão Social
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Data de Criação
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {merchants.map((merchant) => (
            <tr
              key={merchant.id}
              onClick={() => navigate(`/merchants/${merchant.id}`)}
              className="cursor-pointer transition-colors hover:bg-gray-50"
            >
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                {formatCnpj(merchant.cnpj)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                {merchant.legal_name}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <MerchantStatusBadge status={merchant.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                {formatDate(merchant.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
