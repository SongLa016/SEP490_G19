import { useQuery } from "@tanstack/react-query";
import { fetchTimeSlots, fetchTimeSlotsByField } from "../services/timeSlots";

// lấy danh sách thời gian sân
export function useTimeSlots(enabled = true) {
  return useQuery({
    queryKey: ["timeSlots"],
    queryFn: async () => {
      const result = await fetchTimeSlots();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch time slots");
      }
      return result.data || [];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

// lấy danh sách thời gian sân theo sân
export function useTimeSlotsByField(fieldId, enabled = true) {
  return useQuery({
    queryKey: ["timeSlots", "field", fieldId],
    queryFn: async () => {
      if (!fieldId) {
        return [];
      }
      const result = await fetchTimeSlotsByField(fieldId);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch time slots");
      }
      return result.data || [];
    },
    enabled: enabled && !!fieldId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
