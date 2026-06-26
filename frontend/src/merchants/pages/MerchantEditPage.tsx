import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "../../ui/Button";
import { Spinner } from "../../ui/Spinner";
import { useMerchant, useUpdateMerchant } from "../api/merchants";
import { MerchantForm } from "../components/MerchantForm";
import type { MerchantFormValues } from "../components/MerchantForm";

export function MerchantEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const merchantId = Number(id);
  const updateMerchant = useUpdateMerchant();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

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

  async function handleSubmit(values: MerchantFormValues) {
    setServerErrors({});
    setGeneralError("");

    try {
      await updateMerchant.mutateAsync({ id: merchantId, data: values });
      toast.success("Merchant atualizado com sucesso!");
      navigate(`/merchants/${merchantId}`);
    } catch (error: unknown) {
      const err = error as Error & { status?: number; body?: unknown };
      if (err.status === 422 || err.status === 400) {
        const body = err.body as Record<string, string[]> | null;
        if (body) {
          const mapped: Record<string, string> = {};
          for (const [key, messages] of Object.entries(body)) {
            if (key === "status" || key === "detail" || key === "non_field_errors") {
              setGeneralError(Array.isArray(messages) ? messages[0] : String(messages));
            } else {
              mapped[key] = Array.isArray(messages) ? messages[0] : String(messages);
            }
          }
          setServerErrors(mapped);
        }
        toast.error("Erro de validação. Verifique os campos.");
      } else {
        toast.error("Erro ao atualizar merchant. Tente novamente.");
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/merchants/${merchantId}`)}>
          &larr; Voltar
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="mb-6 text-xl font-bold text-gray-900">
          Editar Merchant
        </h1>

        <MerchantForm
          key={merchant.id}
          onSubmit={handleSubmit}
          defaultValues={{
            cnpj: merchant.cnpj,
            legal_name: merchant.legal_name,
            trade_name: merchant.trade_name,
            contact_email: merchant.contact_email,
            phone: merchant.phone,
          }}
          isSubmitting={updateMerchant.isPending}
          serverErrors={serverErrors}
          generalError={generalError}
        />
      </div>
    </div>
  );
}
