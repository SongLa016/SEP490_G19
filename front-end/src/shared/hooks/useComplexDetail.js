import { useQuery } from '@tanstack/react-query';
import { fetchComplexDetail } from '../services/fields';

/**
 * Custom hook to fetch and cache complex detail
 * @param {number|string} complexId - The complex ID
 * @param {object} options - Query options (date, slotId)
 * @param {boolean} enabled - Whether to enable the query
 */
export function useComplexDetail(complexId, options = {}, enabled = true) {
     const { date, slotId } = options;
     
     return useQuery({
          queryKey: ['complexDetail', complexId, date, slotId],
          queryFn: () => fetchComplexDetail(complexId, { date, slotId }),
          enabled: enabled && !!complexId,
          staleTime: 2 * 60 * 1000, // Cache for 2 minutes
          cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
          retry: 1,
          refetchOnWindowFocus: false,
     });
}
