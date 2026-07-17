import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GlobalContactSettings } from "@/types/site-settings";

export const siteSettingsKeys = {
  all: ["site-settings"] as const,
  contact: () => [...siteSettingsKeys.all, "contact"] as const,
};

export function useContactSettingsQuery() {
  return useQuery({
    queryKey: siteSettingsKeys.contact(),
    queryFn: async () => ({} as any),
  });
}

export function useUpdateContactSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: GlobalContactSettings) => ({} as any),
    onSuccess: (data) => {
      queryClient.setQueryData(siteSettingsKeys.contact(), data);
    },
  });
}
