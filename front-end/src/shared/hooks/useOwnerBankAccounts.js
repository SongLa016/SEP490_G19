import { useQuery } from "@tanstack/react-query";
import { fetchOwnerBankAccounts } from "../services/ownerBankAccount";

// lấy danh sách tài khoản ngân hàng của chủ sân
export function useOwnerBankAccounts(ownerId, enabled = true) {
  return useQuery({
    queryKey: ["ownerBankAccounts", ownerId],
    queryFn: async () => {
      if (!ownerId) {
        return [];
      }
      const result = await fetchOwnerBankAccounts(ownerId);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch bank accounts");
      }
      return result.data || [];
    },
    enabled: enabled && !!ownerId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
