import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GlobalContactSettings } from "@/types/site-settings";
import type { LocalizedText } from "@/types/common";

const emptyLocalizedText: LocalizedText = { th: "", en: "", de: "" };

const fallbackContactSettings: GlobalContactSettings = {
  address: emptyLocalizedText,
  phone: "",
  email: "",
  social: {},
  openingHours: {
    days: emptyLocalizedText,
    time: "",
  },
  transport: {},
  map: {},
  bank: {
    name: "",
  },
};

export const siteSettingsKeys = {
  all: ["site-settings"] as const,
  contact: () => [...siteSettingsKeys.all, "contact"] as const,
};

export function useContactSettingsQuery() {
  return useQuery({
    queryKey: siteSettingsKeys.contact(),
    queryFn: async (): Promise<GlobalContactSettings> => fallbackContactSettings,
  });
}

export function useUpdateContactSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: GlobalContactSettings): Promise<GlobalContactSettings> => payload,
    onSuccess: (data) => {
      queryClient.setQueryData(siteSettingsKeys.contact(), data);
    },
  });
}
