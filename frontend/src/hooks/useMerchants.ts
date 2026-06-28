import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMerchant,
  fetchMerchant,
  fetchMerchants,
  fetchTimeline,
  statusTransition,
  updateMerchant,
} from "../api/merchants";

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

export function useCreateMerchant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMerchant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchants"] });
    },
  });
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
