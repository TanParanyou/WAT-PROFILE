import { useQuery } from "@tanstack/react-query";
import { publicContentService } from "@/services/publicContentService";
import { shouldRetryPublicQuery } from "../shared/query-error";
import type {
  PublicAboutContent,
  PublicContactContent,
  PublicImpressumContent,
  PublicPrivacyContent,
} from "./types";

export const publicContentKeys = {
  all: ["public", "content"] as const,
  about: () => [...publicContentKeys.all, "about"] as const,
  contact: () => [...publicContentKeys.all, "contact"] as const,
  privacy: () => [...publicContentKeys.all, "privacy"] as const,
  impressum: () => [...publicContentKeys.all, "impressum"] as const,
};

const queryOptions = { staleTime: 60_000, retry: shouldRetryPublicQuery };

export function usePublicAboutQuery() {
  return useQuery<PublicAboutContent>({ ...queryOptions, queryKey: publicContentKeys.about(), queryFn: publicContentService.getPublicAbout });
}

export function usePublicContactQuery() {
  return useQuery<PublicContactContent>({ ...queryOptions, queryKey: publicContentKeys.contact(), queryFn: publicContentService.getPublicContact });
}

export function usePublicPrivacyQuery() {
  return useQuery<PublicPrivacyContent>({ ...queryOptions, queryKey: publicContentKeys.privacy(), queryFn: publicContentService.getPublicPrivacy });
}

export function usePublicImpressumQuery() {
  return useQuery<PublicImpressumContent>({ ...queryOptions, queryKey: publicContentKeys.impressum(), queryFn: publicContentService.getPublicImpressum });
}
