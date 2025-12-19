import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchComplexes, fetchFields } from "../services/fields";
import { fetchFieldTypes } from "../services/fieldTypes";

/**
 * Hook để prefetch và cache data cho các trang chính
 * Giúp chuyển trang nhanh hơn bằng cách cache data với React Query
 */

// Query keys
export const QUERY_KEYS = {
  COMPLEXES: "complexes",
  FIELDS: "fields",
  FIELD_TYPES: "fieldTypes",
  DISTRICTS: "districts",
};

// Stale time: 5 phút - data sẽ được coi là "fresh" trong 5 phút
const STALE_TIME = 5 * 60 * 1000;

/**
 * Hook để load danh sách complexes (khu sân)
 */
export function useComplexes(params = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.COMPLEXES, params],
    queryFn: () => fetchComplexes({ page: 1, size: 100, ...params }),
    staleTime: STALE_TIME,
    gcTime: 10 * 60 * 1000, // Cache 10 phút
  });
}

/**
 * Hook để load danh sách fields (sân)
 */
export function useFields(params = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.FIELDS, params],
    queryFn: () => fetchFields(params),
    staleTime: STALE_TIME,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook để load field types
 */
export function useFieldTypes() {
  return useQuery({
    queryKey: [QUERY_KEYS.FIELD_TYPES],
    queryFn: fetchFieldTypes,
    staleTime: 30 * 60 * 1000, // Field types ít thay đổi, cache 30 phút
    gcTime: 60 * 60 * 1000,
  });
}

/**
 * Hook để load danh sách quận/huyện từ complexes
 */
export function useDistricts() {
  const { data: complexesData } = useComplexes({ page: 1, size: 200 });

  return useQuery({
    queryKey: [QUERY_KEYS.DISTRICTS],
    queryFn: () => {
      const list = Array.isArray(complexesData?.data?.data)
        ? complexesData.data.data
        : Array.isArray(complexesData?.data)
        ? complexesData.data
        : Array.isArray(complexesData)
        ? complexesData
        : [];

      const normalizeText = (text) => {
        if (typeof text !== "string") return "";
        return text
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase()
          .trim();
      };

      const normalizeDistrictKey = (text) => {
        const normalized = normalizeText(text);
        return normalized.replace(/^(quan|huyen|thi xa)\s+/i, "");
      };

      const map = new Map();
      list.forEach((c) => {
        const raw = typeof c?.district === "string" ? c.district.trim() : "";
        if (!raw) return;
        const baseKey = normalizeDistrictKey(raw);
        const hasPrefix = /^(Quận|Huyện|Thị xã)/i.test(raw);
        if (!map.has(baseKey)) {
          map.set(baseKey, raw);
          return;
        }
        const current = map.get(baseKey);
        const currentHasPrefix = /^(Quận|Huyện|Thị xã)/i.test(current);
        if (hasPrefix && !currentHasPrefix) {
          map.set(baseKey, raw);
        }
      });

      return Array.from(map.values())
        .sort((a, b) => a.localeCompare(b, "vi"))
        .map((v) => ({ value: v, label: v, query: v }));
    },
    enabled: !!complexesData,
    staleTime: STALE_TIME,
  });
}

/**
 * Hook để prefetch data cho các trang
 * Gọi khi hover vào navigation links
 */
export function usePrefetchPageData() {
  const queryClient = useQueryClient();

  const prefetchHome = () => {
    // Prefetch complexes cho HomePage
    queryClient.prefetchQuery({
      queryKey: [QUERY_KEYS.COMPLEXES, { page: 1, size: 200 }],
      queryFn: () => fetchComplexes({ page: 1, size: 200 }),
      staleTime: STALE_TIME,
    });
  };

  const prefetchSearch = () => {
    // Prefetch data cho FieldSearch
    queryClient.prefetchQuery({
      queryKey: [QUERY_KEYS.COMPLEXES, { page: 1, size: 100 }],
      queryFn: () => fetchComplexes({ page: 1, size: 100 }),
      staleTime: STALE_TIME,
    });

    queryClient.prefetchQuery({
      queryKey: [QUERY_KEYS.FIELD_TYPES],
      queryFn: fetchFieldTypes,
      staleTime: 30 * 60 * 1000,
    });
  };

  return {
    prefetchHome,
    prefetchSearch,
  };
}
