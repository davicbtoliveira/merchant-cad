import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "../../ui/Button";
import { useCreateMerchant } from "../api/merchants";
import { MerchantForm } from "../components/MerchantForm";
import type { MerchantFormValues } from "../components/MerchantForm";

export function MerchantNewPage() {
  const navigate = useNavigate();
  const createMerchant = useCreateMerchant();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  async function handleSubmit(values: MerchantFormValues) {
    setServerErrors({});

    try {
      const merchant = await createMerchant.mutateAsync(values);
      toast.success("Merchant criado com sucesso!");
      navigate(`/merchants/${merchant.id}`);
    } catch (error: unknown) {
      const err = error as Error & { status?: number; body?: unknown };
      if (err.status === 422 || err.status === 400) {
        const body = err.body as Record<string, string[]> | null;
        if (body) {
          const mapped: Record<string, string> = {};
          for (const [key, messages] of Object.entries(body)) {
            mapped[key] = Array.isArray(messages) ? messages[0] : String(messages);
          }
          setServerErrors(mapped);
        }
        toast.error("Erro de validação. Verifique os campos.");
      } else {
        toast.error("Erro ao criar merchant. Tente novamente.");
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/merchants")}>
          &larr; Voltar
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="mb-6 text-xl font-bold text-gray-900">
          Novo Merchant
        </h1>

        <MerchantForm
          onSubmit={handleSubmit}
          isSubmitting={createMerchant.isPending}
          serverErrors={serverErrors}
        />
      </div>
    </div>
  );
}
