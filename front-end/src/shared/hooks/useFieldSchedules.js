import { useQuery } from '@tanstack/react-query';
import { fetchPublicFieldSchedulesByField } from '../services/fieldSchedules';

/**
 * Custom hook to fetch and cache field schedules
 * @param {number|string} fieldId - The field ID
 * @param {string} selectedDate - The selected date in YYYY-MM-DD format
 * @param {boolean} enabled - Whether to enable the query
 */
export function useFieldSchedules(fieldId, selectedDate, enabled = true) {
     return useQuery({
          queryKey: ['fieldSchedules', fieldId, selectedDate],
          queryFn: async () => {
               if (!fieldId) {
                    return [];
               }

               const result = await fetchPublicFieldSchedulesByField(fieldId);
               
               if (!result.success || !Array.isArray(result.data)) {
                    console.warn('⚠️ [useFieldSchedules] No schedules data or invalid response:', result);
                    return [];
               }
               // Helper function to normalize date for comparison
               const normalizeDate = (dateValue) => {
                    if (!dateValue) return "";
                    if (typeof dateValue === 'string') {
                         return dateValue.split('T')[0];
                    }
                    if (dateValue && typeof dateValue === 'object' && dateValue.year) {
                         return `${dateValue.year}-${String(dateValue.month).padStart(2, '0')}-${String(dateValue.day).padStart(2, '0')}`;
                    }
                    return String(dateValue);
               };

               // Filter schedules by selectedDate
               const normalizedSelectedDate = normalizeDate(selectedDate);
               const filteredSchedules = result.data.filter(schedule => {
                    const scheduleDate = schedule.date || schedule.Date;
                    const normalizedScheduleDate = normalizeDate(scheduleDate);
                    return normalizedScheduleDate === normalizedSelectedDate;
               });
               return filteredSchedules;
          },
          enabled: enabled && !!fieldId,
          staleTime: 2 * 60 * 1000, // Cache for 2 minutes
          cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
          retry: 1,
          refetchOnWindowFocus: false,
     });
}
