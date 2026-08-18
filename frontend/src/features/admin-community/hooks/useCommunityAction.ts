"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { useTranslations } from "next-intl";
import { adminCommunityKeys } from "../queries";

interface CommunityActionOptions {
  onSuccessMessage?: string;
  onErrorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useCommunityAction<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  options?: CommunityActionOptions,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations("Admin.community");

  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminCommunityKeys.all });
      toast.success(options?.onSuccessMessage ?? t("actionSuccess"));
      options?.onSuccess?.();
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error
          ? err.message
          : options?.onErrorMessage ?? t("actionError");
      toast.error(message);
      if (err instanceof Error) {
        options?.onError?.(err);
      }
    },
  });
}
