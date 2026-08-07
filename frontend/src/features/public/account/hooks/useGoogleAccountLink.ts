"use client";

import { useCallback, useState } from "react";
import { useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import {
  accountKeys,
  useGoogleLinkStatus,
} from "@/features/public/account/queries";
import {
  startGoogleLink,
  toAccountApiError,
  unlinkGoogleAccount,
} from "@/features/public/account/api";
import { useAccountReauth } from "@/features/public/account/hooks/useAccountReauth";
import { AccountReauthError } from "@/features/public/account/reauth/reauth-types";
import { useGoogleRedirect } from "@/features/public/account/hooks/useGoogleRedirect";
import type {
  AccountApiError,
  GoogleLinkStatus,
} from "@/features/public/account/types";

export type GoogleLinkStartOutcome =
  | { kind: "cooldown" }
  | { kind: "redirect"; url: string }
  | { kind: "error"; error: AccountApiError };

export async function runGoogleLinkStart(args: {
  status: GoogleLinkStatus | undefined;
  locale: string;
  start: (locale: string, returnTo: string) => Promise<string>;
}): Promise<GoogleLinkStartOutcome> {
  if (args.status?.pending && args.status.retry_after_seconds > 0) {
    return { kind: "cooldown" };
  }
  try {
    const url = await args.start(args.locale, "/account?tab=security");
    return { kind: "redirect", url };
  } catch (error) {
    return { kind: "error", error: toAccountApiError(error) };
  }
}

export async function runReauthThenLinkStart(args: {
  password: string;
  reauthenticate: (password: string) => Promise<void>;
  status: GoogleLinkStatus | undefined;
  locale: string;
  start: (locale: string, returnTo: string) => Promise<string>;
}): Promise<GoogleLinkStartOutcome> {
  try {
    await args.reauthenticate(args.password);
  } catch (error) {
    return { kind: "error", error: toAccountApiError(error) };
  }
  return runGoogleLinkStart({
    status: args.status,
    locale: args.locale,
    start: args.start,
  });
}

export function useGoogleAccountLink() {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { requireRecentAuth } = useAccountReauth();
  const { redirecting, markRedirecting } = useGoogleRedirect();
  const { data: status, isLoading } = useGoogleLinkStatus();

  const [error, setError] = useState<AccountApiError | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const redirectToGoogle = useCallback(
    async (outcome: GoogleLinkStartOutcome) => {
      if (outcome.kind === "cooldown") {
        return;
      }
      if (outcome.kind === "error") {
        setError(outcome.error);
        await queryClient.invalidateQueries({
          queryKey: accountKeys.googleLink(),
        });
        return;
      }
      markRedirecting();
      window.location.assign(outcome.url);
    },
    [markRedirecting, queryClient],
  );

  const startLink = useCallback(async () => {
    clearError();
    let outcome = await runGoogleLinkStart({
      status,
      locale,
      start: startGoogleLink,
    });
    if (
      outcome.kind === "error" &&
      outcome.error.code === "AUTH_REAUTH_REQUIRED"
    ) {
      try {
        await requireRecentAuth({ reason: "link_google" });
        outcome = await runGoogleLinkStart({
          status,
          locale,
          start: startGoogleLink,
        });
      } catch (requestError) {
        if (
          requestError instanceof AccountReauthError &&
          requestError.code === "AUTH_REAUTH_CANCELLED"
        )
          return;
        setError(toAccountApiError(requestError));
        return;
      }
    }
    await redirectToGoogle(outcome);
  }, [clearError, locale, redirectToGoogle, requireRecentAuth, status]);

  const retryLink = useCallback(async () => startLink(), [startLink]);

  const unlink = useCallback(async (): Promise<boolean> => {
    clearError();
    setUnlinking(true);
    try {
      await requireRecentAuth({ reason: "unlink_google" });
      await unlinkGoogleAccount();
      queryClient.setQueryData<GoogleLinkStatus>(
        accountKeys.googleLink(),
        (current) =>
          current ? { ...current, connected: false, pending: false } : current,
      );
      await queryClient.invalidateQueries({
        queryKey: accountKeys.googleLink(),
      });
      await queryClient.invalidateQueries({ queryKey: accountKeys.current() });
      return true;
    } catch (unlinkError) {
      if (
        unlinkError instanceof AccountReauthError &&
        unlinkError.code === "AUTH_REAUTH_CANCELLED"
      ) {
        return false;
      }
      setError(toAccountApiError(unlinkError));
      return false;
    } finally {
      setUnlinking(false);
    }
  }, [clearError, queryClient, requireRecentAuth]);

  return {
    status,
    loading: isLoading,
    redirecting,
    unlinking,
    error,
    startLink,
    retryLink,
    unlink,
    clearError,
  };
}
