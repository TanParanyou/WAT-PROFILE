import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { publicContentService } from "@/services/publicContentService";
import type {
  AboutContentFormData,
  ContactContentFormData,
  PrivacyContentFormData,
  ImpressumContentFormData,
} from "@/types/public-content";

export const publicContentKeys = {
  all: ["public-content"] as const,
  about: () => [...publicContentKeys.all, "about"] as const,
  contact: () => [...publicContentKeys.all, "contact"] as const,
  privacy: () => [...publicContentKeys.all, "privacy"] as const,
  impressum: () => [...publicContentKeys.all, "impressum"] as const,
};

// --- About Hooks ---
export function useAboutContentQuery() {
  return useQuery({
    queryKey: publicContentKeys.about(),
    queryFn: () => publicContentService.getAbout(),
  });
}

export function useUpdateAboutContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AboutContentFormData) => publicContentService.updateAbout(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(publicContentKeys.about(), data);
    },
  });
}

// --- Contact Hooks ---
export function useContactContentQuery() {
  return useQuery({
    queryKey: publicContentKeys.contact(),
    queryFn: () => publicContentService.getContact(),
  });
}

export function useUpdateContactContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ContactContentFormData) => publicContentService.updateContact(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(publicContentKeys.contact(), data);
    },
  });
}

// --- Privacy Hooks ---
export function usePrivacyContentQuery() {
  return useQuery({
    queryKey: publicContentKeys.privacy(),
    queryFn: () => publicContentService.getPrivacy(),
  });
}

export function useUpdatePrivacyContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PrivacyContentFormData) => publicContentService.updatePrivacy(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(publicContentKeys.privacy(), data);
    },
  });
}

// --- Impressum Hooks ---
export function useImpressumContentQuery() {
  return useQuery({
    queryKey: publicContentKeys.impressum(),
    queryFn: () => publicContentService.getImpressum(),
  });
}

export function useUpdateImpressumContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ImpressumContentFormData) => publicContentService.updateImpressum(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(publicContentKeys.impressum(), data);
    },
  });
}
