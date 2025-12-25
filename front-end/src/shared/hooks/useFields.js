import { useQuery } from "@tanstack/react-query";
import { fetchComplexes, fetchFields } from "../services/fields";

// lấy danh sách khu sân
export function useFieldComplexes(enabled = true) {
  return useQuery({
    queryKey: ["fieldComplexes"],
    enabled,
    queryFn: async () => {
      const res = await fetchComplexes();
      if (!res || !Array.isArray(res)) {
        return [];
      }
      return res;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// tìm kiếm sân nhỏ theo bộ lọc
export function useFieldsSearch(params = {}, enabled = true) {
  const {
    query = "",
    date = "",
    slotId = "",
    sortBy = "relevance",
    useApi = true,
  } = params;

  return useQuery({
    queryKey: ["fields", { query, date, slotId, sortBy, useApi }],
    enabled,
    queryFn: async () => {
      const res = await fetchFields({
        query,
        date,
        slotId,
        sortBy,
        useApi,
      });
      if (!res || !Array.isArray(res)) {
        return [];
      }
      return res;
    },
    staleTime: 3 * 60 * 1000,
    cacheTime: 8 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
