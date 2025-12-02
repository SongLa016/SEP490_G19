import { useQuery } from "@tanstack/react-query";
import { fetchTimeSlots, fetchTimeSlotsByField } from "../services/timeSlots";

/**
 * Custom hook to fetch and cache all time slots
 * @param {boolean} enabled - Whether to enable the query
 */
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

/**
 * Custom hook to fetch and cache time slots by field
 * @param {number|string} fieldId - The field ID
 * @param {boolean} enabled - Whether to enable the query
 */
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
