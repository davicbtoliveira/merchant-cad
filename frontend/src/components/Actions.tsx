import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import type { Merchant } from "../types/merchant";
import {
  useSubmitForAnalysis,
  useApproveMerchant,
  useRejectMerchant,
  useBlockMerchant,
  useReopenMerchant,
  useUnblockMerchant,
} from "../hooks/useMerchants";

interface MerchantActionsProps {
  merchant: Merchant;
}

function ReasonDialog({
  title,
  onConfirm,
  onCancel,
  isPending,
}: {
  title: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
        <textarea
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Motivo (obrigatório)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || isPending}
          >
            {isPending ? "Aguardando..." : "Confirmar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MerchantActions({ merchant }: MerchantActionsProps) {
  const [dialogAction, setDialogAction] = useState<
    "reject" | "block" | "reopen" | "unblock" | null
  >(null);

  const submitForAnalysis = useSubmitForAnalysis();
  const approveMerchant = useApproveMerchant();
  const rejectMerchant = useRejectMerchant();
  const blockMerchant = useBlockMerchant();
  const reopenMerchant = useReopenMerchant();
  const unblockMerchant = useUnblockMerchant();

  async function handleAction(
    action: typeof submitForAnalysis,
    reason?: string,
  ) {
    try {
      await action.mutateAsync({ merchantId: merchant.id, reason });
      toast.success("Status atualizado com sucesso!");
    } catch (error: unknown) {
      const err = error as Error & { status?: number; body?: unknown };
      if (err.status === 422) {
        const body = err.body as Record<string, string[]> | null;
        const message =
          body && body.status
            ? (Array.isArray(body.status) ? body.status[0] : String(body.status))
            : "Transição não permitida para este status.";
        toast.error(message);
      } else {
        toast.error("Erro ao atualizar status. Tente novamente.");
      }
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {merchant.status === "draft" && (
          <Button
            onClick={() => handleAction(submitForAnalysis)}
            disabled={submitForAnalysis.isPending}
          >
            {submitForAnalysis.isPending ? "Aguardando..." : "Enviar para análise"}
          </Button>
        )}

        {merchant.status === "pending_analysis" && (
          <>
            <Button
              onClick={() => handleAction(approveMerchant)}
              disabled={approveMerchant.isPending}
            >
              {approveMerchant.isPending ? "Aguardando..." : "Aprovar"}
            </Button>
            <Button
              variant="danger"
              onClick={() => setDialogAction("reject")}
              disabled={rejectMerchant.isPending}
            >
              {rejectMerchant.isPending ? "Aguardando..." : "Rejeitar"}
            </Button>
          </>
        )}

        {merchant.status === "approved" && (
          <Button
            variant="danger"
            onClick={() => setDialogAction("block")}
            disabled={blockMerchant.isPending}
          >
            {blockMerchant.isPending ? "Aguardando..." : "Bloquear"}
          </Button>
        )}

        {merchant.status === "rejected" && (
          <Button
            onClick={() => setDialogAction("reopen")}
            disabled={reopenMerchant.isPending}
          >
            {reopenMerchant.isPending ? "Aguardando..." : "Reabrir"}
          </Button>
        )}

        {merchant.status === "blocked" && (
          <Button
            onClick={() => setDialogAction("unblock")}
            disabled={unblockMerchant.isPending}
          >
            {unblockMerchant.isPending ? "Aguardando..." : "Desbloquear"}
          </Button>
        )}
      </div>

      {dialogAction === "reject" && (
        <ReasonDialog
          title="Rejeitar Merchant"
          onConfirm={async (reason) => {
            setDialogAction(null);
            await handleAction(rejectMerchant, reason);
          }}
          onCancel={() => setDialogAction(null)}
          isPending={rejectMerchant.isPending}
        />
      )}

      {dialogAction === "block" && (
        <ReasonDialog
          title="Bloquear Merchant"
          onConfirm={async (reason) => {
            setDialogAction(null);
            await handleAction(blockMerchant, reason);
          }}
          onCancel={() => setDialogAction(null)}
          isPending={blockMerchant.isPending}
        />
      )}

      {dialogAction === "reopen" && (
        <ReasonDialog
          title="Reabrir Merchant"
          onConfirm={async (reason) => {
            setDialogAction(null);
            await handleAction(reopenMerchant, reason);
          }}
          onCancel={() => setDialogAction(null)}
          isPending={reopenMerchant.isPending}
        />
      )}

      {dialogAction === "unblock" && (
        <ReasonDialog
          title="Desbloquear Merchant"
          onConfirm={async (reason) => {
            setDialogAction(null);
            await handleAction(unblockMerchant, reason);
          }}
          onCancel={() => setDialogAction(null)}
          isPending={unblockMerchant.isPending}
        />
      )}
    </>
  );
}
