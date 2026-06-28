import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { siteSettingsAdminService } from "@/services/siteSettingsService";
import type { GlobalContactSettings } from "@/types/site-settings";

export const siteSettingsKeys = {
  all: ["site-settings"] as const,
  contact: () => [...siteSettingsKeys.all, "contact"] as const,
};

export function useContactSettingsQuery() {
  return useQuery({
    queryKey: siteSettingsKeys.contact(),
    queryFn: () => siteSettingsAdminService.getContactSettings(),
  });
}

export function useUpdateContactSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GlobalContactSettings) => siteSettingsAdminService.updateContactSettings(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(siteSettingsKeys.contact(), data);
    },
  });
}
