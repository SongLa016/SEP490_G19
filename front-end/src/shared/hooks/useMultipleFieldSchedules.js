import { useQuery } from '@tanstack/react-query';
import { fetchPublicFieldSchedulesByField } from '../services/fieldSchedules';

/**
 * Custom hook to fetch and cache field schedules for multiple fields
 * @param {Array<number|string>} fieldIds - Array of field IDs
 * @param {string} selectedDate - The selected date in YYYY-MM-DD format
 * @param {boolean} enabled - Whether to enable the query
 */
export function useMultipleFieldSchedules(fieldIds = [], selectedDate, enabled = true) {
     return useQuery({
          queryKey: ['multipleFieldSchedules', fieldIds, selectedDate],
          queryFn: async () => {
               if (!Array.isArray(fieldIds) || fieldIds.length === 0) {
                    return [];
               }

               // Fetch schedules for all fields in parallel
               const schedulePromises = fieldIds.map(fieldId => 
                    fetchPublicFieldSchedulesByField(fieldId)
               );

               const results = await Promise.all(schedulePromises);

               // Combine all schedules into a single array
               let allSchedules = [];
               results.forEach((result, index) => {
                    if (result.success && Array.isArray(result.data)) {
                         allSchedules = allSchedules.concat(result.data);
                    } else {
                         console.warn(`⚠️ [useMultipleFieldSchedules] Failed to fetch schedules for fieldId: ${fieldIds[index]}`, result);
                    }
               });

               console.log(`✅ [useMultipleFieldSchedules] Fetched ${allSchedules.length} total schedules for ${fieldIds.length} fields`);

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
               const filteredSchedules = allSchedules.filter(schedule => {
                    const scheduleDate = schedule.date || schedule.Date;
                    const normalizedScheduleDate = normalizeDate(scheduleDate);
                    return normalizedScheduleDate === normalizedSelectedDate;
               });

               console.log(`✅ [useMultipleFieldSchedules] Filtered schedules for date ${normalizedSelectedDate}: ${filteredSchedules.length} schedules`);

               return filteredSchedules;
          },
          enabled: enabled && Array.isArray(fieldIds) && fieldIds.length > 0,
          staleTime: 2 * 60 * 1000, // Cache for 2 minutes
          cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
          retry: 1,
          refetchOnWindowFocus: false,
     });
}

