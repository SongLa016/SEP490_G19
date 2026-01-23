import { useQuery } from "@tanstack/react-query";
import { fetchComplexes, fetchFields } from "../services/fields";

export function useFieldSearchQuery({ searchQuery, date, slotId, sortBy }) {
  // Query for complexes
  const complexesQuery = useQuery({
    queryKey: ["complexes", { searchQuery, date, slotId }],
    queryFn: () => fetchComplexes({ query: searchQuery, date, slotId, useApi: true }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
  });

  // Query for fields
  const fieldsQuery = useQuery({
    queryKey: ["fields", { searchQuery, date, slotId, sortBy }],
    queryFn: () => fetchFields({ query: searchQuery, date, slotId, sortBy, useApi: true }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
  });

  return {
    complexes: complexesQuery.data || [],
    fields: fieldsQuery.data || [],
    isLoading: complexesQuery.isLoading || fieldsQuery.isLoading,
    isError: complexesQuery.isError || fieldsQuery.isError,
    error: complexesQuery.error || fieldsQuery.error,
    refetch: () => {
      complexesQuery.refetch();
      fieldsQuery.refetch();
    }
  };
}
