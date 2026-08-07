import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  closeAccount,
  fetchAccount,
  fetchGoogleLinkStatus,
  fetchSessions,
  logoutAccount,
  logoutAllAccounts,
  revokeAccountSession,
  uploadAccountAvatar,
  updateAccountProfile,
} from "./api";
import {
  toPublicQueryError,
  shouldRetryPublicQuery,
} from "../shared/query-error";
import type { Account, AccountProfileUpdateInput } from "./types";

export const accountKeys = {
  current: () => ["account", "current"] as const,
  sessions: () => ["account", "sessions"] as const,
  googleLink: () => ["account", "google-link"] as const,
};

export function useAccount(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: accountKeys.current(),
    queryFn: fetchAccount,
    staleTime: 60_000,
    retry: shouldRetryPublicQuery,
    enabled: options?.enabled ?? true,
  });
}

export function useAccountSessions(enabled?: boolean) {
  return useQuery({
    queryKey: accountKeys.sessions(),
    queryFn: fetchSessions,
    staleTime: 30_000,
    retry: shouldRetryPublicQuery,
    enabled: enabled ?? false,
  });
}

export function useGoogleLinkStatus(enabled?: boolean) {
  return useQuery({
    queryKey: accountKeys.googleLink(),
    queryFn: fetchGoogleLinkStatus,
    staleTime: 30_000,
    retry: shouldRetryPublicQuery,
    enabled: enabled ?? true,
  });
}

export function useUpdateAccountProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AccountProfileUpdateInput) =>
      updateAccountProfile(input),
    onSuccess: (account: Account) => {
      queryClient.setQueryData(accountKeys.current(), account);
    },
  });
}

export function useUploadAccountAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadAccountAvatar(file),
    onSuccess: (account: Account) => {
      queryClient.setQueryData(accountKeys.current(), account);
    },
  });
}

export function useRevokeAccountSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => revokeAccountSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.sessions() });
    },
  });
}

export function useCloseAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => closeAccount(),
    onSuccess: ({ purge_after }) => {
      const current = queryClient.getQueryData<Account>(accountKeys.current());
      if (current) {
        queryClient.setQueryData(accountKeys.current(), {
          ...current,
          account_status: "closed",
          purge_after,
        });
      }
    },
  });
}

export function useLogoutAccount() {
  return useMutation({
    mutationFn: logoutAccount,
  });
}

export function useLogoutAllAccounts() {
  return useMutation({
    mutationFn: logoutAllAccounts,
  });
}

export function toAccountQueryError(error: unknown) {
  return toPublicQueryError(error);
}
