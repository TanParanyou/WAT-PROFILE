"use client";

import { useMutation } from "@tanstack/react-query";
import { aiTranslationService, type AiTranslateRequest, type AiTranslateResponse } from "@/services/aiTranslationService";
import { useToast } from "./useToast";
import { useTranslations } from "next-intl";

export function useAiTranslate() {
  const { toast } = useToast();
  const t = useTranslations("Admin.aiTranslate");

  const mutation = useMutation<AiTranslateResponse, Error, AiTranslateRequest>({
    mutationFn: (payload: AiTranslateRequest) => aiTranslationService.translateDraft(payload),
    onSuccess: () => {
      toast.success(t("success"));
    },
    onError: (err: unknown) => {
      let errorMessage = t("error");
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { error?: string } } }).response;
        if (response?.data?.error) {
          errorMessage = response.data.error;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    },
  });

  return {
    translateDraft: mutation.mutateAsync,
    isTranslating: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
