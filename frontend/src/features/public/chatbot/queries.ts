import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchQuickQuestions, sendChatMessage } from "./api";
import { shouldRetryPublicQuery } from "../shared/query-error";
import type { ChatMessageRequestDto } from "./types";

export const publicChatbotKeys = {
  all: ["public", "chatbot"] as const,
  quickQuestions: (locale?: string) =>
    [...publicChatbotKeys.all, "quick-questions", locale ?? "th"] as const,
};

export function useQuickQuestionsQuery(locale?: string) {
  return useQuery({
    queryKey: publicChatbotKeys.quickQuestions(locale),
    queryFn: () => fetchQuickQuestions(locale),
    staleTime: 5 * 60_000,
    retry: shouldRetryPublicQuery,
  });
}

export function useSendChatMessageMutation() {
  return useMutation({
    mutationFn: (payload: ChatMessageRequestDto) => sendChatMessage(payload),
  });
}
