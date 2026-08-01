"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLoginPage() {
  const t = useTranslations("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // ถ้า login แล้ว redirect ไป dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/admin");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });
      router.push("/admin");
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = err as any;
      const status = axiosError?.response?.status;
      const errData = axiosError?.response?.data;
      const message = errData?.message || errData?.error;

      if (status === 401) {
        setError(t("login.invalidCredentials"));
      } else if (message) {
        setError(message);
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
        <div className="bg-admin-surface rounded-xl border border-admin-border p-6">
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
              <div className="bg-admin-danger-surface border border-admin-danger/20 text-admin-danger text-sm rounded-lg px-4 py-3">
                {error}
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
