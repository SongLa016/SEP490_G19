import { useQuery } from "@tanstack/react-query";
import { fetchPublicFieldSchedulesByField } from "../services/fieldSchedules";

// lấy lịch sân theo nhiều sân
export function useMultipleFieldSchedules(
  fieldIds = [],
  selectedDate,
  enabled = true
) {
  return useQuery({
    queryKey: ["multipleFieldSchedules", fieldIds, selectedDate],
    queryFn: async () => {
      if (!Array.isArray(fieldIds) || fieldIds.length === 0) {
        return [];
      }

      // lấy lịch sân theo từng sân
      const schedulePromises = fieldIds.map((fieldId) =>
        fetchPublicFieldSchedulesByField(fieldId)
      );

      const results = await Promise.all(schedulePromises);

      // kết hợp tất cả lịch sân thành một mảng
      let allSchedules = [];
      results.forEach((result, index) => {
        if (result.success && Array.isArray(result.data)) {
          allSchedules = allSchedules.concat(result.data);
        } else {
        }
      });
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
      const filteredSchedules = allSchedules.filter((schedule) => {
        const scheduleDate = schedule.date || schedule.Date;
        const normalizedScheduleDate = normalizeDate(scheduleDate);
        return normalizedScheduleDate === normalizedSelectedDate;
      });
      return filteredSchedules;
    },
    enabled: enabled && Array.isArray(fieldIds) && fieldIds.length > 0,
    staleTime: 2 * 60 * 1000, // lưu trữ trong 2 phút
    cacheTime: 5 * 60 * 1000, // lưu trữ trong 5 phút
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
