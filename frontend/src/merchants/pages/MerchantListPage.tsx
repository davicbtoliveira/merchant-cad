import { useNavigate, useSearchParams } from "react-router";
import { Button } from "../../ui/Button";
import { Select } from "../../ui/Select";
import { useMerchants } from "../api/merchants";
import { MerchantTable } from "../components/MerchantTable";

const statusOptions = [
  { value: "draft", label: "Rascunho" },
  { value: "pending_analysis", label: "Em análise" },
  { value: "approved", label: "Aprovado" },
  { value: "rejected", label: "Rejeitado" },
  { value: "blocked", label: "Bloqueado" },
];

export function MerchantListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status");

  const { data: merchants, isLoading } = useMerchants(statusFilter);

  function handleStatusChange(value: string) {
    if (value) {
      setSearchParams({ status: value });
    } else {
      setSearchParams({});
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Merchants</h1>
        <Button onClick={() => navigate("/merchants/new")}>
          Novo
        </Button>
      </div>

      <div className="mb-4">
        <Select
          label="Filtrar por status"
          options={statusOptions}
          placeholder="Todos os status"
          value={statusFilter ?? ""}
          onChange={(e) => handleStatusChange(e.target.value)}
        />
      </div>

      <MerchantTable merchants={merchants ?? []} isLoading={isLoading} />
    </div>
  );
}
