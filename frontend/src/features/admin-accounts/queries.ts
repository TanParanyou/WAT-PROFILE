import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { accountOperationsAdminService } from "@/services/accountOperationsAdminService";
import type { AdminListParams } from "@/features/admin-list/types";
import type {
  AccountFilters,
  AccountOperationReason,
  AdminAccountSummary,
} from "./types";

export const adminAccountKeys = {
  all: ["admin", "account-operations"] as const,
  list: (params: AdminListParams<AccountFilters>) =>
    [...adminAccountKeys.all, "list", params] as const,
  detail: (id: string) => [...adminAccountKeys.all, "detail", id] as const,
  events: (id: string, params: AdminListParams) =>
    [...adminAccountKeys.all, "events", id, params] as const,
};

export function useAdminAccountDetail(id: string | null) {
  return useQuery({
    queryKey: id ? adminAccountKeys.detail(id) : [...adminAccountKeys.all, "detail", "none"],
    queryFn: () => accountOperationsAdminService.getById(id || ""),
    enabled: Boolean(id),
  });
}

export function useAdminAccountEvents(id: string | null, params: AdminListParams) {
  const query = useQuery({
    queryKey: id ? adminAccountKeys.events(id, params) : [...adminAccountKeys.all, "events", "none"],
    queryFn: () => accountOperationsAdminService.getSecurityEvents(id || "", params),
    enabled: Boolean(id),
  });
  return {
    ...query,
    rows: query.data?.data ?? [],
    pagination: query.data?.pagination ?? { page: params.page, limit: params.limit, total: 0, totalPages: 0 },
  };
}

function useAccountMutation(
  mutationFn: (id: string, reason: AccountOperationReason) => Promise<AdminAccountSummary>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: AccountOperationReason }) =>
      mutationFn(id, reason),
    onSuccess: async (account) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminAccountKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminAccountKeys.detail(account.id) }),
        queryClient.invalidateQueries({ queryKey: [...adminAccountKeys.all, "events", account.id] }),
      ]);
    },
  });
}

export function useDisableAdminAccount() {
  return useAccountMutation(accountOperationsAdminService.disable);
}

export function useEnableAdminAccount() {
  return useAccountMutation(accountOperationsAdminService.enable);
}

export function useLogoutAllAdminAccount() {
  return useAccountMutation(accountOperationsAdminService.logoutAll);
}
