"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { accountKeys, useAccount } from "./queries";
import {
  loginAccount,
  logoutAccount,
  logoutAllAccounts,
  reauthenticateAccount,
  restoreSession,
  setMemoryAccessToken,
  toAccountApiError,
} from "./api";
import { classifyAccountSessionError } from "./sessionPolicy";
import type { Account } from "./types";
import type { AccountSessionEndReason } from "./sessionPolicy";

const ACCOUNT_FEATURE_ENABLED =
  process.env.NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED === "true";

export type AccountSessionStatus = "loading" | "anonymous" | "authenticated";

export interface AccountSessionValue {
  status: AccountSessionStatus;
  account: Account | null;
  accountLoading: boolean;
  accountError: unknown;
  sessionEndReason: AccountSessionEndReason | null;
  retryAccount: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  adoptCurrentSession: () => Promise<void>;
  clearLocalSession: () => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AccountSessionContext = createContext<AccountSessionValue | null>(null);

export function AccountSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AccountSessionStatus>(
    ACCOUNT_FEATURE_ENABLED ? "loading" : "anonymous",
  );
  const [sessionEndReason, setSessionEndReason] =
    useState<AccountSessionEndReason | null>(null);

  // Restore the session by refreshing once; on success the account query below
  // re-fetches with the restored access token (held in module memory). Remote
  // data lives in TanStack Query.
  useEffect(() => {
    if (!ACCOUNT_FEATURE_ENABLED) return;
    // The Google re-auth callback is opened in a same-origin popup. Its
    // callback page only posts completion to the opener; it must not rotate
    // the shared refresh cookie because the opener performs that rotation.
    if (
      typeof window !== "undefined" &&
      window.opener &&
      new URLSearchParams(window.location.search).get("reauth") === "complete"
    ) {
      return;
    }
    let cancelled = false;

    async function restore() {
      try {
        // Rotate the session using the HttpOnly refresh cookie. The fresh
        // access token is held in module memory by the API client; the account
        // query below then re-fetches with it.
        await restoreSession();
        if (cancelled) return;
        setStatus("authenticated");
        await queryClient.invalidateQueries({
          queryKey: accountKeys.current(),
        });
      } catch {
        if (!cancelled) setStatus("anonymous");
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  const accountQuery = useAccount({
    enabled: ACCOUNT_FEATURE_ENABLED && status === "authenticated",
  });
  const { refetch: refetchAccount } = accountQuery;

  const retryAccount = useCallback(async () => {
    await refetchAccount();
  }, [refetchAccount]);

  const login = useCallback(
    async (email: string, password: string) => {
      await loginAccount(email, password);
      setStatus("authenticated");
      setSessionEndReason(null);
      await queryClient.invalidateQueries({ queryKey: accountKeys.current() });
    },
    [queryClient],
  );

  const reauthenticate = useCallback(async (password: string) => {
    await reauthenticateAccount(password);
  }, []);

  // Adopts a session whose access token was already placed in module memory by
  // confirmGoogleLink (or an equivalent sign-in), then re-fetches the account
  // with that token in the current tab.
  const adoptCurrentSession = useCallback(async () => {
    setStatus("authenticated");
    setSessionEndReason(null);
    await queryClient.invalidateQueries({ queryKey: accountKeys.current() });
    await queryClient.invalidateQueries({ queryKey: accountKeys.googleLink() });
  }, [queryClient]);

  const clearLocalSession = useCallback(
    (reason: AccountSessionEndReason | null = null) => {
    setMemoryAccessToken(null);
    setStatus("anonymous");
    setSessionEndReason(reason);
    queryClient.removeQueries({ queryKey: accountKeys.current() });
    queryClient.removeQueries({ queryKey: accountKeys.sessions() });
    queryClient.removeQueries({ queryKey: accountKeys.googleLink() });
    },
    [queryClient],
  );

  useEffect(() => {
    if (status !== "authenticated" || !accountQuery.error) return;
    const reason = classifyAccountSessionError(
      toAccountApiError(accountQuery.error),
    );
    if (reason) clearLocalSession(reason);
  }, [accountQuery.error, clearLocalSession, status]);

  const logout = useCallback(async () => {
    try {
      await logoutAccount();
    } finally {
      clearLocalSession();
    }
  }, [clearLocalSession]);

  const logoutAll = useCallback(async () => {
    try {
      await logoutAllAccounts();
    } finally {
      clearLocalSession();
    }
  }, [clearLocalSession]);

  const value = useMemo<AccountSessionValue>(
    () => ({
      status,
      account: accountQuery.data ?? null,
      accountLoading: accountQuery.isPending,
      accountError: accountQuery.error,
      sessionEndReason,
      retryAccount,
      login,
      reauthenticate,
      adoptCurrentSession,
      clearLocalSession,
      logout,
      logoutAll,
    }),
    [
      status,
      accountQuery.data,
      accountQuery.isPending,
      accountQuery.error,
      sessionEndReason,
      retryAccount,
      login,
      reauthenticate,
      adoptCurrentSession,
      clearLocalSession,
      logout,
      logoutAll,
    ],
  );

  return (
    <AccountSessionContext.Provider value={value}>
      {children}
    </AccountSessionContext.Provider>
  );
}

export function useAccountSession(): AccountSessionValue {
  const context = useContext(AccountSessionContext);
  if (!context) {
    throw new Error(
      "useAccountSession must be used within AccountSessionProvider",
    );
  }
  return context;
}
