"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Bell, Mail, ShieldAlert, Key } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import adminSecurityService from "@/services/adminSecurityService";
import type { SecurityPreferences } from "@/types/security";

export function SecurityPreferencesCard() {
  const t = useTranslations("Admin");
  const { toast } = useToast();

  const [preferences, setPreferences] = useState<SecurityPreferences>({
    email_on_new_device: true,
    email_on_failed_login: true,
    email_on_security_change: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminSecurityService.getSecurityPreferences();
      setPreferences(data);
    } catch {
      toast.error(t("security.fetchPreferencesError"));
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleToggle = async (key: keyof SecurityPreferences) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(updated);
    setSavingKey(key);

    try {
      const res = await adminSecurityService.updateSecurityPreferences(updated);
      setPreferences(res);
      toast.success(t("security.preferencesUpdatedSuccess"));
    } catch (err: unknown) {
      // Revert state on failure
      setPreferences(preferences);
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      toast.error(errorMsg || t("security.updatePreferencesError"));
    } finally {
      setSavingKey(null);
    }
  };

  const items = [
    {
      key: "email_on_new_device" as const,
      icon: <Mail size={18} />,
      title: t("security.prefNewDeviceTitle"),
      desc: t("security.prefNewDeviceDesc"),
    },
    {
      key: "email_on_failed_login" as const,
      icon: <ShieldAlert size={18} />,
      title: t("security.prefFailedLoginTitle"),
      desc: t("security.prefFailedLoginDesc"),
    },
    {
      key: "email_on_security_change" as const,
      icon: <Key size={18} />,
      title: t("security.prefSecurityChangeTitle"),
      desc: t("security.prefSecurityChangeDesc"),
    },
  ];

  return (
    <div className="bg-admin-surface border border-admin-border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-admin-border">
        <div className="h-10 w-10 bg-admin-surface-muted border border-admin-border flex items-center justify-center text-admin-foreground">
          <Bell size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-admin-foreground">
            {t("security.notificationsTitle")}
          </h2>
          <p className="text-xs text-admin-muted">
            {t("security.notificationsSubtitle")}
          </p>
        </div>
      </div>

      {/* Toggles */}
      <div className="divide-y divide-admin-border border border-admin-border">
        {items.map((item) => {
          const isEnabled = preferences[item.key];
          const isSaving = savingKey === item.key;

          return (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 bg-admin-surface hover:bg-admin-surface-muted transition-colors gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-admin-surface-muted border border-admin-border text-admin-foreground shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-medium text-admin-foreground">
                    {item.title}
                  </h3>
                  <p className="text-xs text-admin-muted">{item.desc}</p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                disabled={isLoading || isSaving}
                onClick={() => handleToggle(item.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-action focus-visible:ring-offset-2 ${
                  isEnabled ? "bg-admin-action" : "bg-admin-border"
                } ${isLoading || isSaving ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-admin-surface shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
