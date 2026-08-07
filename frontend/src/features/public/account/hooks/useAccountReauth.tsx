"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  restoreSession,
  startGoogleReauthentication,
  toAccountApiError,
} from "../api";
import { useAccountSession } from "../AccountSessionProvider";
import { useAccountErrorMessage } from "../hooks";
import {
  createReauthPopupMessage,
  isReauthPopupMessage,
} from "../reauth/reauth-intent";
import {
  AccountReauthError,
  type ReauthReason,
  type ReauthResult,
} from "../reauth/reauth-types";
import { AccountReauthModal } from "../components/AccountReauthModal";

interface RequireRecentAuthOptions {
  reason: ReauthReason;
}

interface AccountReauthContextValue {
  requireRecentAuth: (
    options: RequireRecentAuthOptions,
  ) => Promise<ReauthResult>;
}

interface PendingRequest {
  reason: ReauthReason;
  resolve: (result: ReauthResult) => void;
  reject: (error: unknown) => void;
  popup: Window | null;
  closeTimer: number | null;
}

const AccountReauthContext = createContext<AccountReauthContextValue | null>(
  null,
);

export function useAccountReauth(): AccountReauthContextValue {
  const context = useContext(AccountReauthContext);
  if (!context)
    throw new Error(
      "useAccountReauth must be used within AccountReauthProvider",
    );
  return context;
}

export function AccountReauthProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("Account");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const getErrorMessage = useAccountErrorMessage();
  const { account, reauthenticate, adoptCurrentSession } = useAccountSession();
  const pendingRef = useRef<PendingRequest | null>(null);
  const [activeReason, setActiveReason] = useState<ReauthReason | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const googleOnly = account ? !account.providers.includes("password") : false;

  const clearPendingTimer = (pending: PendingRequest) => {
    if (pending.closeTimer !== null) window.clearInterval(pending.closeTimer);
    pending.closeTimer = null;
  };

  const finish = useCallback((result: ReauthResult) => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearPendingTimer(pending);
    pendingRef.current = null;
    setActiveReason(null);
    setError(null);
    setBusy(false);
    setRedirecting(false);
    pending.resolve(result);
  }, []);

  const fail = useCallback((requestError: unknown) => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearPendingTimer(pending);
    if (pending.popup && !pending.popup.closed) pending.popup.close();
    pendingRef.current = null;
    setActiveReason(null);
    setBusy(false);
    setRedirecting(false);
    pending.reject(requestError);
  }, []);

  const showError = useCallback(
    (requestError: unknown) => {
      setError(getErrorMessage(toAccountApiError(requestError)));
      setBusy(false);
      setRedirecting(false);
    },
    [getErrorMessage],
  );

  const completeGoogleReauth = useCallback(async () => {
    if (!pendingRef.current) return;
    setBusy(true);
    setRedirecting(false);
    try {
      await restoreSession();
      await adoptCurrentSession();
      finish({ method: "google", authenticatedAt: new Date().toISOString() });
    } catch (requestError) {
      showError(requestError);
    }
  }, [adoptCurrentSession, finish, showError]);

  useEffect(() => {
    if (searchParams.get("reauth") !== "complete" || !window.opener) return;
    window.opener.postMessage(
      createReauthPopupMessage(true),
      window.location.origin,
    );
    window.close();
  }, [searchParams]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      const pending = pendingRef.current;
      if (
        !pending ||
        event.origin !== window.location.origin ||
        event.source !== pending.popup
      )
        return;
      if (!isReauthPopupMessage(event.data)) return;
      if (event.data.success) {
        void completeGoogleReauth();
      } else {
        showError(
          new AccountReauthError(
            "AUTH_REAUTH_CANCELLED",
            event.data.code ?? t("account.reauthCancelled"),
          ),
        );
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [completeGoogleReauth, showError, t]);

  useEffect(() => {
    return () => {
      const pending = pendingRef.current;
      if (!pending) return;
      clearPendingTimer(pending);
      if (pending.popup && !pending.popup.closed) pending.popup.close();
      pending.reject(
        new AccountReauthError(
          "AUTH_REAUTH_CANCELLED",
          t("account.reauthCancelled"),
        ),
      );
      pendingRef.current = null;
    };
  }, [t]);

  const requireRecentAuth = useCallback(
    ({ reason }: RequireRecentAuthOptions) => {
      if (pendingRef.current) {
        return Promise.reject(
          new AccountReauthError(
            "AUTH_REAUTH_IN_PROGRESS",
            t("account.reauthInProgress"),
          ),
        );
      }

      setError(null);
      setBusy(false);
      setRedirecting(false);
      setActiveReason(reason);
      return new Promise<ReauthResult>((resolve, reject) => {
        pendingRef.current = {
          reason,
          resolve,
          reject,
          popup: null,
          closeTimer: null,
        };
      });
    },
    [t],
  );

  const handleClose = useCallback(() => {
    fail(
      new AccountReauthError(
        "AUTH_REAUTH_CANCELLED",
        t("account.reauthCancelled"),
      ),
    );
  }, [fail, t]);

  const handlePasswordSubmit = useCallback(
    async (password: string) => {
      if (!pendingRef.current) return;
      setError(null);
      setBusy(true);
      try {
        await reauthenticate(password);
        finish({
          method: "password",
          authenticatedAt: new Date().toISOString(),
        });
      } catch (requestError) {
        showError(requestError);
      }
    },
    [finish, reauthenticate, showError],
  );

  const handleGoogleContinue = useCallback(async () => {
    const pending = pendingRef.current;
    if (!pending) return;
    setError(null);
    setRedirecting(true);
    const popup = window.open(
      "about:blank",
      "wat-account-reauth",
      "popup,width=480,height=720",
    );
    if (!popup) {
      showError(
        new AccountReauthError(
          "AUTH_REAUTH_POPUP_BLOCKED",
          t("account.reauthPopupBlocked"),
        ),
      );
      return;
    }
    pending.popup = popup;
    try {
      const url = await startGoogleReauthentication(
        locale,
        "/account?reauth=complete",
      );
      popup.location.href = url;
      pending.closeTimer = window.setInterval(() => {
        if (!pending.popup || !pending.popup.closed) return;
        clearPendingTimer(pending);
        showError(
          new AccountReauthError(
            "AUTH_REAUTH_CANCELLED",
            t("account.reauthCancelled"),
          ),
        );
      }, 400);
    } catch (requestError) {
      popup.close();
      showError(requestError);
    }
  }, [locale, showError, t]);

  const value = useMemo(() => ({ requireRecentAuth }), [requireRecentAuth]);

  return (
    <AccountReauthContext.Provider value={value}>
      {children}
      <AccountReauthModal
        key={activeReason ?? "closed"}
        open={activeReason !== null}
        reason={activeReason}
        googleOnly={googleOnly}
        busy={busy}
        redirecting={redirecting}
        error={error}
        onClose={handleClose}
        onPasswordSubmit={handlePasswordSubmit}
        onGoogleContinue={handleGoogleContinue}
      />
    </AccountReauthContext.Provider>
  );
}
