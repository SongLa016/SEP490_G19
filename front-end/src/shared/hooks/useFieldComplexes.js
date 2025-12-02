import { useQuery } from "@tanstack/react-query";
import {
  fetchAllComplexesWithFields,
  fetchFieldsByComplex,
} from "../services/fields";

/**
 * Custom hook to fetch and cache all field complexes with their fields
 * @param {boolean} enabled - Whether to enable the query
 */
export function useFieldComplexes(enabled = true) {
  return useQuery({
    queryKey: ["fieldComplexes"],
    queryFn: async () => {
      const result = await fetchAllComplexesWithFields();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch field complexes");
      }
      return result.data || [];
    },
    enabled,
    staleTime: 3 * 60 * 1000, // Cache for 3 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Custom hook to fetch and cache fields by complex ID
 * @param {number|string} complexId - The complex ID
 * @param {boolean} enabled - Whether to enable the query
 */
export function useFieldsByComplex(complexId, enabled = true) {
  return useQuery({
    queryKey: ["fields", "complex", complexId],
    queryFn: async () => {
      if (!complexId) {
        return [];
      }
      const result = await fetchFieldsByComplex(complexId);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch fields");
      }
      return result.data || [];
    },
    enabled: enabled && !!complexId,
    staleTime: 3 * 60 * 1000, // Cache for 3 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
