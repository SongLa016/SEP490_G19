import { useQuery } from "@tanstack/react-query";
import { fetchComplexDetail } from "../services/fields";

// lấy thông tin chi tiết sân
export function useComplexDetail(complexId, options = {}, enabled = true) {
  const { date, slotId } = options;

  return useQuery({
    queryKey: ["complexDetail", complexId, date, slotId],
    queryFn: () => fetchComplexDetail(complexId, { date, slotId }),
    enabled: enabled && !!complexId,
    staleTime: 2 * 60 * 1000, // lưu trữ trong 2 phút
    cacheTime: 5 * 60 * 1000, // lưu trữ trong 5 phút
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    refetchOnWindowFocus: false,
  });
}
