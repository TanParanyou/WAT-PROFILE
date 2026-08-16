"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Clock, LogOut, CheckCircle } from "lucide-react";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import { Button } from "@/components/ui/Button";

export function InactivityTimeoutDialog() {
  const t = useTranslations("Admin");
  const { isWarningOpen, secondsRemaining, stayLoggedIn, logout } =
    useInactivityTimeout();

  if (!isWarningOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactivity-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-overlay/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md bg-admin-surface border border-admin-border p-6 shadow-xl space-y-5">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 shrink-0 bg-admin-warning-surface border border-admin-warning/20 text-admin-warning flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div className="space-y-1">
            <h3
              id="inactivity-dialog-title"
              className="text-base font-semibold text-admin-foreground"
            >
              {t("security.sessionTimeoutWarningTitle")}
            </h3>
            <p className="text-xs text-admin-muted">
              {t("security.sessionTimeoutWarningDesc")}
            </p>
          </div>
        </div>

        <div className="bg-admin-surface-muted border border-admin-border p-4 flex items-center justify-center gap-2 text-admin-foreground">
          <Clock size={18} className="text-admin-warning animate-pulse" />
          <span className="text-sm font-medium">
            {t("security.autoLogoutIn", { seconds: secondsRemaining })}
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={logout}
            icon={<LogOut size={14} />}
          >
            {t("security.logoutNow")}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={stayLoggedIn}
            icon={<CheckCircle size={14} />}
          >
            {t("security.stayLoggedIn")}
          </Button>
        </div>
      </div>
    </div>
  );
}
