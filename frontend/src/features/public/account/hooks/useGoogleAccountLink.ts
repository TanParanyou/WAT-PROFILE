"use client";

import { useCallback, useState } from "react";
import { useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { accountKeys, useGoogleLinkStatus } from "@/features/public/account/queries";
import {
  startGoogleLink,
  toAccountApiError,
  unlinkGoogleAccount,
} from "@/features/public/account/api";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { useGoogleRedirect } from "@/features/public/account/hooks/useGoogleRedirect";
import type { AccountApiError, GoogleLinkStatus } from "@/features/public/account/types";

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
    const url = await args.start(args.locale, "/account");
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
  return runGoogleLinkStart({ status: args.status, locale: args.locale, start: args.start });
}

export function useGoogleAccountLink() {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { reauthenticate } = useAccountSession();
  const { redirecting, markRedirecting } = useGoogleRedirect();
  const { data: status, isLoading } = useGoogleLinkStatus();

  const [error, setError] = useState<AccountApiError | null>(null);
  const [requiresReauth, setRequiresReauth] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
    setRequiresReauth(false);
  }, []);

  const redirectToGoogle = useCallback(
    async (outcome: GoogleLinkStartOutcome) => {
      if (outcome.kind === "cooldown") {
        return;
      }
      if (outcome.kind === "error") {
        if (outcome.error.code === "AUTH_REAUTH_REQUIRED") {
          setRequiresReauth(true);
        }
        setError(outcome.error);
        await queryClient.invalidateQueries({ queryKey: accountKeys.googleLink() });
        return;
      }
      markRedirecting();
      window.location.assign(outcome.url);
    },
    [markRedirecting, queryClient],
  );

  const startLink = useCallback(async () => {
    clearError();
    const outcome = await runGoogleLinkStart({ status, locale, start: startGoogleLink });
    await redirectToGoogle(outcome);
  }, [clearError, locale, redirectToGoogle, status]);

  const retryLink = useCallback(
    async (password: string) => {
      clearError();
      const outcome = await runReauthThenLinkStart({
        password,
        reauthenticate,
        status,
        locale,
        start: startGoogleLink,
      });
      await redirectToGoogle(outcome);
    },
    [clearError, locale, reauthenticate, redirectToGoogle, status],
  );

  const unlink = useCallback(
    async (password: string) => {
      clearError();
      setUnlinking(true);
      try {
        await reauthenticate(password);
        await unlinkGoogleAccount(password);
        await queryClient.invalidateQueries({ queryKey: accountKeys.googleLink() });
        await queryClient.invalidateQueries({ queryKey: accountKeys.current() });
      } catch (unlinkError) {
        setError(toAccountApiError(unlinkError));
      } finally {
        setUnlinking(false);
      }
    },
    [clearError, queryClient, reauthenticate],
  );

  return {
    status,
    loading: isLoading,
    redirecting,
    unlinking,
    error,
    requiresReauth,
    startLink,
    retryLink,
    unlink,
    clearError,
  };
}
