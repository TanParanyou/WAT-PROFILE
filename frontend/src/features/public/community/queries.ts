import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shouldRetryPublicQuery } from "../shared/query-error";
import {
  fetchCommunityCategories,
  fetchCommunityQuestion,
  createCommunityQuestion,
  deleteCommunityQuestion,
  fetchCommunityActivity,
  fetchCommunityViewerState,
  fetchOwnedCommunityQuestion,
  fetchCommunityQuestions,
  updateCommunityQuestion,
} from "./api";
import type { CommunityQuestionDetail, CommunityQuestionListOptions, CommunityQuestionMutation } from "./types";

export const communityKeys = {
  all: ["public", "community"] as const,
  categories: () => [...communityKeys.all, "categories"] as const,
  questions: (options: CommunityQuestionListOptions = {}) => [
    ...communityKeys.all,
    "questions",
    options,
  ] as const,
  question: (id: string) => [...communityKeys.all, "question", id] as const,
  ownedQuestion: (id: string) => [...communityKeys.all, "owned-question", id] as const,
  viewer: (id: string) => [...communityKeys.all, "viewer", id] as const,
  activity: () => [...communityKeys.all, "activity"] as const,
};

export function useCommunityCategoriesQuery() {
  return useQuery({
    queryKey: communityKeys.categories(),
    queryFn: fetchCommunityCategories,
    staleTime: 300_000,
    retry: shouldRetryPublicQuery,
  });
}

export function useOwnedCommunityQuestionQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: communityKeys.ownedQuestion(id),
    queryFn: () => fetchOwnedCommunityQuestion(id),
    enabled: Boolean(id) && enabled,
    retry: shouldRetryPublicQuery,
  });
}

export function useCommunityActivityQuery(enabled = true) {
  return useQuery({
    queryKey: communityKeys.activity(),
    queryFn: fetchCommunityActivity,
    enabled,
    retry: shouldRetryPublicQuery,
  });
}

export function useCommunityViewerQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: communityKeys.viewer(id),
    queryFn: () => fetchCommunityViewerState(id),
    enabled: Boolean(id) && enabled,
    retry: shouldRetryPublicQuery,
  });
}

export function useCreateCommunityQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: Parameters<typeof createCommunityQuestion>[0]; idempotencyKey: string }) => createCommunityQuestion(input, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...communityKeys.all, "questions"] });
      queryClient.invalidateQueries({ queryKey: communityKeys.activity() });
    },
  });
}

export function useUpdateCommunityQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateCommunityQuestion>[1] }) => updateCommunityQuestion(id, input),
    onSuccess: (result: CommunityQuestionMutation, variables) => {
      queryClient.setQueryData(communityKeys.ownedQuestion(variables.id), result);
      queryClient.invalidateQueries({ queryKey: communityKeys.question(variables.id) });
      queryClient.invalidateQueries({ queryKey: communityKeys.activity() });
      queryClient.invalidateQueries({ queryKey: [...communityKeys.all, "questions"] });
    },
  });
}

export function useDeleteCommunityQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) => deleteCommunityQuestion(id, version),
    onSuccess: (_result, variables) => {
      queryClient.removeQueries({ queryKey: communityKeys.ownedQuestion(variables.id) });
      queryClient.invalidateQueries({ queryKey: communityKeys.activity() });
      queryClient.invalidateQueries({ queryKey: [...communityKeys.all, "questions"] });
    },
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
