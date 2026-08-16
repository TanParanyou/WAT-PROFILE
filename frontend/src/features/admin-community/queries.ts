import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { communityAdminService } from "@/services/communityAdminService";

export const adminCommunityKeys = {
  all: ["admin", "community"] as const,
  queue: (limit = 50) => [...adminCommunityKeys.all, "queue", limit] as const,
  categories: () => [...adminCommunityKeys.all, "categories"] as const,
};

export function useAdminCommunityQueue(limit = 50) {
  return useQuery({ queryKey: adminCommunityKeys.queue(limit), queryFn: () => communityAdminService.queue(limit), staleTime: 15_000 });
}

export function useAdminCommunityCategories() {
  return useQuery({ queryKey: adminCommunityKeys.categories(), queryFn: communityAdminService.categories, staleTime: 60_000 });
}

function invalidateCommunity(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: adminCommunityKeys.all });
}

export function useAdminCommunityMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => invalidateCommunity(queryClient) });
}

export function useSaveAdminCategory() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ input, id }: { input: Parameters<typeof communityAdminService.saveCategory>[0]; id?: string }) => communityAdminService.saveCategory(input, id), onSuccess: () => invalidateCommunity(queryClient) });
}

export function useDeleteAdminCategory() {
  return useAdminCommunityMutation(({ id, reason }: { id: string; reason: string }) => communityAdminService.deleteCategory(id, reason));
}

export function useReorderAdminCategories() {
  return useAdminCommunityMutation((ids: string[]) => communityAdminService.reorderCategories(ids));
}
