import { useQuery } from "@tanstack/react-query";
import { shouldRetryPublicQuery } from "../shared/query-error";
import { fetchPublicGallery, fetchPublicGalleryCategories } from "./api";

export const publicGalleryKeys = {
  all: ["public", "gallery"] as const,
  items: () => [...publicGalleryKeys.all, "items"] as const,
  categories: () => [...publicGalleryKeys.all, "categories"] as const,
};

const queryOptions = {
  staleTime: 60_000,
  retry: shouldRetryPublicQuery,
};

export function usePublicGalleryQuery() {
  return useQuery({ ...queryOptions, queryKey: publicGalleryKeys.items(), queryFn: fetchPublicGallery });
}

export function usePublicGalleryCategoriesQuery() {
  return useQuery({ ...queryOptions, queryKey: publicGalleryKeys.categories(), queryFn: fetchPublicGalleryCategories });
}
