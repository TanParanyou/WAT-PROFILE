import { useQuery } from "@tanstack/react-query";
import { shouldRetryPublicQuery } from "../shared/query-error";
import { getPublicDonationCategories } from "./api";

export const publicDonationKeys = {
  categories: () => ["public", "donation-categories"] as const,
};

export function usePublicDonationCategoriesQuery() {
  return useQuery({
    queryKey: publicDonationKeys.categories(),
    queryFn: getPublicDonationCategories,
    staleTime: 60_000,
    retry: shouldRetryPublicQuery,
  });
}
