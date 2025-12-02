import { useQuery } from "@tanstack/react-query";
import { fetchOwnerBankAccounts } from "../services/ownerBankAccount";

/**
 * Custom hook to fetch and cache owner bank accounts
 * @param {number|string} ownerId - The owner ID
 * @param {boolean} enabled - Whether to enable the query
 */
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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 15 * 60 * 1000, // Keep in cache for 15 minutes (bank accounts change less frequently)
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
