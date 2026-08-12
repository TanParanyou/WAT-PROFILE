"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import axios from "axios";
import { useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import type { ApiResponse } from "@/types/api";

export default function AdminLoginPage() {
  const t = useTranslations("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading, sessionExpired } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  // ถ้า login แล้ว redirect ไป dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const safePath = returnTo?.startsWith("/admin") ? returnTo : "/admin";
      router.replace(safePath as any);
    }
  }, [authLoading, isAuthenticated, router, returnTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });
      const safePath = returnTo?.startsWith("/admin") ? returnTo : "/admin";
      router.push(safePath as any);
    } catch (err) {
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

  return (
    <div className="min-h-screen bg-admin-canvas flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-admin-foreground">
            {t("login.title")}
          </h1>
          <p className="text-sm text-admin-muted mt-1">{t("login.subtitle")}</p>
        </div>

        {/* Login Form */}
        <div className="bg-admin-surface rounded-none border border-admin-border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
        </div>
      </div>
    </div>
  );
}
