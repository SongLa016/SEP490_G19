import { useQuery } from "@tanstack/react-query";
import { fetchFieldTypes, fetchFieldTypeById } from "../services/fieldTypes";

/**
 * Custom hook to fetch and cache all field types
 * @param {boolean} enabled - Whether to enable the query
 */
export function useFieldTypes(enabled = true) {
  return useQuery({
    queryKey: ["fieldTypes"],
    queryFn: async () => {
      const result = await fetchFieldTypes();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch field types");
      }
      return result.data || [];
    },
    enabled,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes (field types rarely change)
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Custom hook to fetch and cache field type by ID
 * @param {number|string} typeId - The field type ID
 * @param {boolean} enabled - Whether to enable the query
 */
export function useFieldTypeById(typeId, enabled = true) {
  return useQuery({
    queryKey: ["fieldType", typeId],
    queryFn: async () => {
      if (!typeId) {
        return null;
      }
      const result = await fetchFieldTypeById(typeId);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch field type");
      }
      return result.data;
    },
    enabled: enabled && !!typeId,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
