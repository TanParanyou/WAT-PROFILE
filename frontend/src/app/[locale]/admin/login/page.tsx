"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import axios from "axios";
import { useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, KeyRound, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/admin/security/OtpInput";
import { useAuth } from "@/hooks/useAuth";
import type { ApiResponse } from "@/types/api";

import { Suspense } from "react";

function AdminLoginForm() {
  const t = useTranslations("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [isBackupCodeMode, setIsBackupCodeMode] = useState(false);
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, mfaVerify, isAuthenticated, isLoading: authLoading, sessionExpired } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const safePath = returnTo?.startsWith("/admin") ? returnTo : "/admin";
      router.replace(safePath);
    }
  }, [authLoading, isAuthenticated, router, returnTo]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login({ email, password });
      if (result.mfa_required && result.mfa_token) {
        setMfaToken(result.mfa_token);
        setIsMfaStep(true);
        setPassword("");
        setError("");
        return;
      }

      const safePath = returnTo?.startsWith("/admin") ? returnTo : "/admin";
      router.push(safePath);
    } catch (err: unknown) {
      setPassword("");
      if (axios.isAxiosError<ApiResponse<never>>(err)) {
        const code = err.response?.data?.code;
        const status = err.response?.status;
        const details = err.response?.data?.details as { remaining_attempts?: number } | undefined;
        const remaining = details?.remaining_attempts;

        if (code === "ADMIN_ACCOUNT_LOCKED") {
          setError(t("login.accountLocked"));
        } else if (status === 429) {
          setError(t("login.rateLimited"));
        } else if (code === "ADMIN_INVALID_CREDENTIALS") {
          if (typeof remaining === "number" && remaining > 0) {
            if (remaining === 1) {
              setError(t("login.invalidCredentialsLast"));
            } else {
              setError(t("login.invalidCredentialsRemaining", { count: remaining }));
            }
          } else {
            setError(t("login.invalidCredentials"));
          }
        } else {
          setError(t("login.genericError"));
        }
      } else {
        setError(t("login.genericError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await mfaVerify({
        mfa_token: mfaToken,
        code: mfaCode.trim(),
      });
      const safePath = returnTo?.startsWith("/admin") ? returnTo : "/admin";
      router.push(safePath);
    } catch (err: unknown) {
      setMfaCode("");
      if (axios.isAxiosError<ApiResponse<never>>(err)) {
        const code = err.response?.data?.code;
        if (code === "ADMIN_MFA_INVALID_CODE") {
          setError(t("security.invalidMfaCode"));
        } else if (code === "ADMIN_MFA_SESSION_INVALID") {
          setError(t("security.mfaSessionExpired"));
          setIsMfaStep(false);
          setMfaToken("");
        } else {
          setError(t("login.genericError"));
        }
      } else {
        setError(t("login.genericError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setIsMfaStep(false);
    setMfaToken("");
    setMfaCode("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-admin-canvas flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-admin-foreground">
            {isMfaStep ? t("security.mfaChallengeTitle") : t("login.title")}
          </h1>
          <p className="text-sm text-admin-muted mt-1">
            {isMfaStep
              ? isBackupCodeMode
                ? t("security.mfaChallengeBackupSubtitle")
                : t("security.mfaChallengeSubtitle")
              : t("login.subtitle")}
          </p>
        </div>

        {/* Login / MFA Form */}
        <div className="bg-admin-surface rounded-none border border-admin-border p-6">
          {!isMfaStep ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <Input
                id="email"
                type="text"
                label={t("login.email")}
                placeholder="admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
              <Input
                id="password"
                type="password"
                label={t("login.password")}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              {error && (
                <div className="bg-admin-danger-surface border border-admin-danger/20 text-admin-danger text-sm rounded-none px-4 py-3">
                  {error}
                </div>
              )}

              {!error && sessionExpired && (
                <div className="bg-admin-warning-surface border border-admin-warning/20 text-admin-warning text-sm rounded-none px-4 py-3">
                  {t("login.sessionExpired")}
                </div>
              )}

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full"
                size="lg"
              >
                {t("login.submit")}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="flex items-center justify-center p-3 bg-admin-surface-muted border border-admin-border text-admin-foreground gap-2 text-sm font-medium">
                {isBackupCodeMode ? (
                  <>
                    <KeyRound size={18} className="text-admin-action" />
                    <span>{t("security.usingBackupCode")}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} className="text-admin-action" />
                    <span>{t("security.usingTotpCode")}</span>
                  </>
                )}
              </div>

              {isBackupCodeMode ? (
                <Input
                  id="backup-code"
                  type="text"
                  label={t("security.backupCodeLabel")}
                  placeholder="XXXXXXXX"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.toUpperCase())}
                  required
                  autoFocus
                  autoComplete="one-time-code"
                />
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-admin-foreground block text-center">
                    {t("security.totpCodeLabel")}
                  </label>
                  <OtpInput
                    value={mfaCode}
                    onChange={(val) => {
                      setMfaCode(val);
                      setError("");
                    }}
                    autoFocus
                  />
                </div>
              )}

              {error && (
                <div className="bg-admin-danger-surface border border-admin-danger/20 text-admin-danger text-sm rounded-none px-4 py-3">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full"
                size="lg"
              >
                {t("security.verifyAndLogin")}
              </Button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  className="text-admin-muted hover:text-admin-foreground flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>{t("security.backToLogin")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsBackupCodeMode(!isBackupCodeMode);
                    setMfaCode("");
                    setError("");
                  }}
                  className="text-admin-action hover:underline font-medium"
                >
                  {isBackupCodeMode
                    ? t("security.useAuthenticatorApp")
                    : t("security.useBackupCode")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
