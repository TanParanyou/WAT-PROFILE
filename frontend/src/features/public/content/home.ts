import { useQuery } from "@tanstack/react-query";
import { websiteCmsPublicService } from "@/services/websiteCmsService";
import type { PublicContentPage } from "@/types/website-cms";
import { shouldRetryPublicQuery } from "../shared/query-error";

export const publicHomeKeys = {
  all: ["public", "content", "home"] as const,
  page: () => [...publicHomeKeys.all, "page"] as const,
};

export async function fetchPublicHomePage(): Promise<PublicContentPage | null> {
  return websiteCmsPublicService.getPage("home");
}

export function usePublicHomePageQuery() {
  return useQuery({
    queryKey: publicHomeKeys.page(),
    queryFn: fetchPublicHomePage,
    staleTime: 60_000,
    retry: shouldRetryPublicQuery,
  });
}
