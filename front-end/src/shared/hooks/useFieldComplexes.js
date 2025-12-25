import { useQuery } from "@tanstack/react-query";
import {
  fetchAllComplexesWithFields,
  fetchFieldsByComplex,
} from "../services/fields";

// lấy danh sách sân
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
    staleTime: 3 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

// lấy danh sách sân nhỏ
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
    staleTime: 3 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
