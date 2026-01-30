import { useQueries } from "@tanstack/react-query";
import { fetchRatingsByField } from "../services/ratings";

export function useFieldRatings(fields) {
  const fieldIds = fields.map(f => f.fieldId || f.FieldID).filter(Boolean);

  const results = useQueries({
    queries: fieldIds.map((id) => ({
      queryKey: ["fieldRatings", id],
      queryFn: () => fetchRatingsByField(id),
      staleTime: 10 * 60 * 1000, // 10 minutes
    })),
  });

  // Combine results into a map for easy lookup
  const ratingsMap = {};
  results.forEach((result, index) => {
    const fieldId = fieldIds[index];
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      const totalStars = result.data.reduce((sum, r) => sum + (r.stars || 0), 0);
      const averageRating = totalStars / result.data.length;
      ratingsMap[fieldId] = {
        rating: Number(averageRating.toFixed(1)),
        reviewCount: result.data.length,
      };
    } else {
      ratingsMap[fieldId] = {
        rating: 0,
        reviewCount: 0,
      };
    }
  });

  return {
    ratingsMap,
    isLoading: results.some((r) => r.isLoading),
  };
}
