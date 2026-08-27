"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import axios from "axios";
import { useRouter, Link } from "@/navigation";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  Lock,
  Shield,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/admin/security/OtpInput";
import { AdminLanguageSwitcher } from "@/components/admin/AdminLanguageSwitcher";
import { AdminThemeSwitcher } from "@/components/admin/theme/AdminThemeSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { siteConfig } from "@/config/site.config";
import { STATIC_ASSETS } from "@/constants/assets";
import type { ApiResponse } from "@/types/api";

function AdminLoginForm() {
  const t = useTranslations("Admin");
  const tAccount = useTranslations("Account");
  const locale = useLocale();
  const currentLocale = (locale === "en" || locale === "de" ? locale : "th") as "th" | "en" | "de";

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

  const templeName = siteConfig.siteName[currentLocale] || siteConfig.siteName.th;

  return (
    <div className="min-h-screen bg-admin-canvas text-admin-foreground grid grid-cols-1 lg:grid-cols-12 selection:bg-admin-selected selection:text-admin-selected-foreground">
      {/* ------------------------------------------------------------- */}
      {/* Left Column: Brand & Sanctuary Hero Panel (Desktop)           */}
      {/* ------------------------------------------------------------- */}
      <aside className="hidden lg:flex lg:col-span-5 xl:col-span-5 relative flex-col justify-between border-r border-admin-border bg-admin-surface-muted/40 overflow-hidden p-10 xl:p-14">
        {/* Top Content: Branding & Seal */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 shrink-0 border border-admin-border bg-admin-surface flex items-center justify-center p-1.5 shadow-sm">
              <Image
                src={STATIC_ASSETS.LOGO.LIGHT}
                alt={templeName}
                width={40}
                height={40}
                className="w-auto h-auto max-h-9 max-w-9 object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-admin-muted font-mono block">
                Official Admin Portal
              </span>
              <h2 className="text-lg font-bold text-admin-foreground leading-snug">
                {templeName}
              </h2>
            </div>
          </div>

          <div className="pt-4 space-y-2 border-t border-admin-border">
            <span className="inline-block px-2.5 py-0.5 text-xs font-mono uppercase tracking-wide border border-admin-border bg-admin-surface text-admin-foreground">
              ทะเบียนศาลา • Apothecary Register
            </span>
            <p className="text-sm text-admin-body leading-relaxed max-w-sm pt-1">
              ระบบศูนย์กลางการบริหารจัดการข้อมูลศาสนกิจ ทะเบียนกิจกรรม ศาสนสมบัติ และการเผยแผ่ธรรมะ
            </p>
          </div>
        </div>

        {/* Middle Content: Editorial Statement */}
        <div className="relative z-10 my-10 py-6 border-y border-admin-border space-y-3 bg-admin-surface/60 px-5">
          <p className="text-sm font-serif italic text-admin-body leading-relaxed">
            &ldquo;ความบริสุทธิ์ ความสงบ และความรอบคอบในการบันทึกศาสนกิจ คือหัวใจสำคัญของการสืบทอดพระพุทธศาสนา&rdquo;
          </p>
          <div className="flex items-center gap-2 text-xs text-admin-muted font-mono pt-1">
            <CheckCircle2 size={13} className="text-admin-focus" />
            <span>Secure Temple Information Infrastructure</span>
          </div>
        </div>

        {/* Bottom Content: Security Assurance Badges & Copyright */}
        <div className="relative z-10 space-y-6">
          <div className="grid grid-cols-1 gap-2.5 text-xs text-admin-muted">
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-admin-surface border border-admin-border">
              <Shield size={15} className="text-admin-focus shrink-0" />
              <span className="text-admin-body font-medium">256-Bit Encrypted Admin Session</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-admin-surface border border-admin-border">
              <KeyRound size={15} className="text-admin-focus shrink-0" />
              <span className="text-admin-body font-medium">Multi-Factor Authentication (MFA) Protected</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-admin-surface border border-admin-border">
              <FileText size={15} className="text-admin-focus shrink-0" />
              <span className="text-admin-body font-medium">Granular Role-Based Access Control (RBAC)</span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-admin-muted font-mono">
            © {new Date().getFullYear()} {templeName}. All rights reserved.
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* Right Column: Authentication & MFA Workspace                  */}
      {/* ------------------------------------------------------------- */}
      <main className="col-span-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-between min-h-screen p-6 sm:p-10 lg:p-14">
        {/* Top Header Utilities: Back button, Language & Theme Switchers */}
        <header className="flex items-center justify-between gap-3 w-full max-w-lg mx-auto mb-6 sm:mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-admin-body hover:text-admin-foreground min-h-11 px-3 py-2 border border-admin-control-border bg-admin-surface hover:bg-admin-surface-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
          >
            <ArrowLeft size={14} />
            <span>{tAccount("navigation.backToSite")}</span>
          </Link>

          <div className="flex items-center gap-2">
            <AdminLanguageSwitcher />
            <AdminThemeSwitcher />
          </div>
        </header>

        {/* Center Container: Card Form */}
        <div className="w-full max-w-md mx-auto my-auto py-6">
          {/* Mobile Header: Visible only on smaller screens */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 border border-admin-border bg-admin-surface flex items-center justify-center p-1">
              <Image
                src={STATIC_ASSETS.LOGO.LIGHT}
                alt={templeName}
                width={32}
                height={32}
                className="w-auto h-auto max-h-7 max-w-7 object-contain"
              />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-admin-muted font-mono block">
                Admin Console
              </span>
              <h2 className="text-sm font-bold text-admin-foreground">
                {templeName}
              </h2>
            </div>
          </div>

          {/* Form Card (Apothecary Sheet) */}
          <div className="bg-admin-surface border border-admin-border p-6 sm:p-8 shadow-sm">
            {/* Card Title & Subtitle */}
            <div className="mb-6 pb-4 border-b border-admin-border">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-admin-focus mb-1">
                <Lock size={13} />
                <span>{isMfaStep ? "Security Verification" : "Restricted Access"}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-admin-foreground">
                {isMfaStep ? t("security.mfaChallengeTitle") : t("login.title")}
              </h1>
              <p className="text-xs sm:text-sm text-admin-muted mt-1 leading-relaxed">
                {isMfaStep
                  ? isBackupCodeMode
                    ? t("security.mfaChallengeBackupSubtitle")
                    : t("security.mfaChallengeSubtitle")
                  : t("login.subtitle")}
              </p>
            </div>

            {/* Error & Warning Alerts */}
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 bg-admin-danger-surface border border-admin-danger/30 text-admin-danger text-xs sm:text-sm p-3.5 leading-relaxed"
              >
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!error && sessionExpired && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 bg-admin-warning-surface border border-admin-warning/30 text-admin-warning text-xs sm:text-sm p-3.5 leading-relaxed"
              >
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{t("login.sessionExpired")}</p>
                  <p className="text-xs opacity-90 mt-0.5">{t("login.sessionExpiredDetail")}</p>
                </div>
              </div>
            )}

            {/* Step 1: Email & Password Credentials */}
            {!isMfaStep ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div>
                    <Input
                      id="email"
                      type="text"
                      label={t("login.email")}
                      placeholder="admin@watloungporsai.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="username"
                      autoFocus
                    />
                  </div>

                  <div>
                    <Input
                      id="password"
                      type="password"
                      label={t("login.password")}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full min-h-12 text-sm font-semibold tracking-wide"
                  size="lg"
                  icon={!isLoading ? <Lock size={15} /> : undefined}
                >
                  {t("login.submit")}
                </Button>
              </form>
            ) : (
              /* Step 2: Two-Factor MFA Challenge */
              <form onSubmit={handleMfaSubmit} className="space-y-5">
                <div className="flex items-center justify-center p-3 bg-admin-surface-muted border border-admin-border text-admin-foreground gap-2.5 text-xs sm:text-sm font-medium">
                  {isBackupCodeMode ? (
                    <>
                      <KeyRound size={17} className="text-admin-focus" />
                      <span>{t("security.usingBackupCode")}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={17} className="text-admin-focus" />
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
                  <div className="space-y-2.5 py-1">
                    <label className="text-xs font-medium text-admin-body block text-center">
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

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full min-h-12 text-sm font-semibold"
                  size="lg"
                  icon={!isLoading ? <ShieldCheck size={16} /> : undefined}
                >
                  {t("security.verifyAndLogin")}
                </Button>

                <div className="flex items-center justify-between pt-2 border-t border-admin-border/60 text-xs">
                  <button
                    type="button"
                    onClick={handleBackToCredentials}
                    className="text-admin-muted hover:text-admin-foreground flex items-center gap-1.5 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
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
                    className="text-admin-focus hover:underline font-medium py-1 focus-visible:outline-2 focus-visible:outline-admin-focus"
                  >
                    {isBackupCodeMode
                      ? t("security.useAuthenticatorApp")
                      : t("security.useBackupCode")}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Card Footer Notes */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-admin-muted flex items-center justify-center gap-1.5">
              <Lock size={12} className="text-admin-focus" />
              <span>พื้นที่สงวนสิทธิ์เฉพาะพระภิกษุและเจ้าหน้าที่ผู้ดูแลระบบ</span>
            </p>
          </div>
        </div>

        {/* Bottom Bar: Copyright (Mobile & Desktop) */}
        <footer className="w-full max-w-lg mx-auto text-center text-xs text-admin-muted/70 pt-6">
          <span className="font-mono">Wat Loung Por Sai • Secure Admin Panel</span>
        </footer>
      </main>
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
