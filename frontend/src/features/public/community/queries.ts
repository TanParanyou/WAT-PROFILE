import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { shouldRetryPublicQuery } from "../shared/query-error";
import {
  fetchCommunityCategories,
  fetchCommunityQuestion,
  fetchCommunityQuestions,
} from "./api";
import type { CommunityQuestionDetail, CommunityQuestionListOptions } from "./types";

export const communityKeys = {
  all: ["public", "community"] as const,
  categories: () => [...communityKeys.all, "categories"] as const,
  questions: (options: CommunityQuestionListOptions = {}) => [
    ...communityKeys.all,
    "questions",
    options,
  ] as const,
  question: (id: string) => [...communityKeys.all, "question", id] as const,
};

export function useCommunityCategoriesQuery() {
  return useQuery({
    queryKey: communityKeys.categories(),
    queryFn: fetchCommunityCategories,
    staleTime: 300_000,
    retry: shouldRetryPublicQuery,
  });
}

export function useCommunityQuestionsQuery(options: CommunityQuestionListOptions = {}) {
  return useQuery({
    queryKey: communityKeys.questions(options),
    queryFn: () => fetchCommunityQuestions(options),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: shouldRetryPublicQuery,
  });
}

export function useCommunityQuestionQuery(id: string, initialData?: CommunityQuestionDetail) {
  return useQuery({
    queryKey: communityKeys.question(id),
    queryFn: () => fetchCommunityQuestion(id),
    enabled: Boolean(id),
    initialData,
    staleTime: 60_000,
    retry: shouldRetryPublicQuery,
  });
}
