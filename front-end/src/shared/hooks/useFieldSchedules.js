import { useQuery } from "@tanstack/react-query";
import {
  fetchPublicFieldSchedulesByDate,
  fetchPublicFieldSchedulesByField,
} from "../services/fieldSchedules";

// lấy lịch sân theo ngày
export function usePublicFieldSchedulesByDate(date) {
  return useQuery({
    queryKey: ["publicFieldSchedules", date || "all"],
    enabled: !!date,
    queryFn: async () => {
      if (!date) return [];
      const res = await fetchPublicFieldSchedulesByDate(date);
      if (!res.success) {
        throw new Error(res.error || "Không thể tải lịch sân");
      }
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// lấy lịch sân theo sân
export function useFieldSchedules(fieldId, selectedDate, enabled = true) {
  return useQuery({
    queryKey: ["fieldSchedules", fieldId, selectedDate],
    queryFn: async () => {
      if (!fieldId) {
        return [];
      }

      const result = await fetchPublicFieldSchedulesByField(fieldId);

      if (!result.success || !Array.isArray(result.data)) {
        return [];
      }
      // hàm tiện ích để chuẩn hóa ngày
      const normalizeDate = (dateValue) => {
        if (!dateValue) return "";
        if (typeof dateValue === "string") {
          return dateValue.split("T")[0];
        }
        if (dateValue && typeof dateValue === "object" && dateValue.year) {
          return `${dateValue.year}-${String(dateValue.month).padStart(
            2,
            "0"
          )}-${String(dateValue.day).padStart(2, "0")}`;
        }
        return String(dateValue);
      };

      // lọc lịch sân theo ngày chọn
      const normalizedSelectedDate = normalizeDate(selectedDate);
      const filteredSchedules = result.data.filter((schedule) => {
        const scheduleDate = schedule.date || schedule.Date;
        const normalizedScheduleDate = normalizeDate(scheduleDate);
        return normalizedScheduleDate === normalizedSelectedDate;
      });
      return filteredSchedules;
    },
    enabled: enabled && !!fieldId,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
