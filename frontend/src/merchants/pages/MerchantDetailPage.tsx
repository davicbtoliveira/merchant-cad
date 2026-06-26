import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "../../ui/Button";
import { Spinner } from "../../ui/Spinner";
import {
  formatCnpj,
  formatDate,
  useMerchant,
} from "../api/merchants";
import { MerchantStatusBadge } from "../components/MerchantStatusBadge";
import { MerchantTimeline } from "../components/MerchantTimeline";

export function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const merchantId = Number(id);

  const {
    data: merchant,
    isLoading,
    error,
  } = useMerchant(merchantId);

  if (Number.isNaN(merchantId)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-center text-gray-500">ID inválido.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar merchant";

    if (message === "Merchant não encontrado") {
      return (
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">Merchant não encontrado.</p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => navigate("/merchants")}
            >
              Voltar para listagem
            </Button>
          </div>
        </div>
      );
    }

    toast.error(message);

    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">{message}</p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => navigate("/merchants")}
          >
            Voltar para listagem
          </Button>
        </div>
      </div>
    );
  }

  if (!merchant) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/merchants")}>
          &larr; Voltar
        </Button>
      </div>

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              {merchant.legal_name}
            </h1>
            <MerchantStatusBadge status={merchant.status} />
          </div>
          <Button onClick={() => navigate(`/merchants/${merchant.id}/edit`)}>
            Editar
          </Button>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
              CNPJ
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatCnpj(merchant.cnpj)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Razão Social
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {merchant.legal_name}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Nome Fantasia
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {merchant.trade_name || "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
              E-mail
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {merchant.contact_email}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Telefone
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {merchant.phone || "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Data de Criação
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatDate(merchant.created_at)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Timeline
        </h2>
        <MerchantTimeline merchantId={merchant.id} />
      </div>
    </div>
  );
}
