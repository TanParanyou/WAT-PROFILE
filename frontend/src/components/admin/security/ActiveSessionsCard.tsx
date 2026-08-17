"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Laptop,
  Smartphone,
  Globe,
  Trash2,
  LogOut,
  AlertTriangle,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import adminSecurityService from "@/services/adminSecurityService";
import type { AdminSessionItem } from "@/types/security";

function parseDevice(userAgent: string): { type: "desktop" | "mobile" | "unknown"; name: string } {
  if (!userAgent) return { type: "unknown", name: "Unknown Device" };

  const isMobile = /mobile|iphone|ipad|android/i.test(userAgent);
  let browser = "Browser";
  if (/chrome|crios/i.test(userAgent)) browser = "Chrome";
  else if (/firefox|fxios/i.test(userAgent)) browser = "Firefox";
  else if (/safari/i.test(userAgent)) browser = "Safari";
  else if (/edge|edg/i.test(userAgent)) browser = "Edge";

  let os = "OS";
  if (/windows/i.test(userAgent)) os = "Windows";
  else if (/macintosh|mac os x/i.test(userAgent)) os = "macOS";
  else if (/iphone|ipad/i.test(userAgent)) os = "iOS";
  else if (/android/i.test(userAgent)) os = "Android";
  else if (/linux/i.test(userAgent)) os = "Linux";

  return {
    type: isMobile ? "mobile" : "desktop",
    name: `${browser} on ${os}`,
  };
}

export function ActiveSessionsCard() {
  const t = useTranslations("Admin");
  const { toast } = useToast();
  const { logout } = useAuth();

  const [sessions, setSessions] = useState<AdminSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Revoke single session confirm modal
  const [sessionToRevoke, setSessionToRevoke] = useState<AdminSessionItem | null>(null);
  const [isRevokingSingle, setIsRevokingSingle] = useState(false);

  // Revoke other sessions modal
  const [isRevokeOtherOpen, setIsRevokeOtherOpen] = useState(false);
  const [isRevokingOther, setIsRevokingOther] = useState(false);

  // Auto Logout Countdown Modal
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(5);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminSecurityService.getSessions();
      setSessions(data);
    } catch {
      toast.error(t("security.fetchSessionsError"));
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleFinalLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      window.location.href = "/admin/login";
    }
  }, [logout]);

  // Robust Countdown Timer Interval
  useEffect(() => {
    if (!isCountingDown) return;

    setCountdownSeconds(5);
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCountingDown]);

  // Auto trigger logout when countdown reaches 0
  useEffect(() => {
    if (isCountingDown && countdownSeconds === 0) {
      handleFinalLogout();
    }
  }, [isCountingDown, countdownSeconds, handleFinalLogout]);

  const handleOpenRevokeModal = (session: AdminSessionItem) => {
    setSessionToRevoke(session);
  };

  const handleConfirmRevokeSingle = async () => {
    if (!sessionToRevoke) return;

    const isCurrent = sessionToRevoke.is_current;
    setIsRevokingSingle(true);
    try {
      await adminSecurityService.revokeSession(sessionToRevoke.id);
      setSessionToRevoke(null);
      if (isCurrent) {
        // Launch countdown modal which leads to automatic logout
        setIsCountingDown(true);
      } else {
        toast.success(t("security.revokeSessionSuccess"));
        await fetchSessions();
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      toast.error(errorMsg || t("security.revokeSessionError"));
    } finally {
      setIsRevokingSingle(false);
    }
  };

  const handleRevokeOther = async () => {
    setIsRevokingOther(true);
    try {
      const res = await adminSecurityService.revokeOtherSessions();
      toast.success(t("security.revokeOtherSuccess", { count: res.revoked_count }));
      setIsRevokeOtherOpen(false);
      await fetchSessions();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      toast.error(errorMsg || t("security.revokeOtherError"));
    } finally {
      setIsRevokingOther(false);
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.is_current).length;

  return (
    <div className="bg-admin-surface border border-admin-border p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-admin-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-admin-surface-muted border border-admin-border flex items-center justify-center text-admin-foreground">
            <Globe size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-admin-foreground">
              {t("security.activeSessionsTitle")}
            </h2>
            <p className="text-xs text-admin-muted">
              {t("security.activeSessionsSubtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            isLoading={isLoading}
            icon={<RefreshCw size={14} />}
          >
            {t("common.refresh")}
          </Button>

          {otherSessionsCount > 0 && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setIsRevokeOtherOpen(true)}
              icon={<LogOut size={14} />}
            >
              {t("security.revokeAllOtherBtn")}
            </Button>
          )}
        </div>
      </div>

      {/* Session List */}
      <div className="space-y-3">
        {isLoading && sessions.length === 0 ? (
          <div className="p-8 text-center text-xs text-admin-muted">
            {t("common.loading")}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-xs text-admin-muted bg-admin-surface-muted border border-admin-border">
            {t("security.noActiveSessions")}
          </div>
        ) : (
          sessions.map((session) => {
            const device = parseDevice(session.user_agent);

            return (
              <div
                key={session.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border gap-4 transition-colors ${
                  session.is_current
                    ? "bg-admin-action/5 border-admin-action/30"
                    : "bg-admin-surface-muted border-admin-border"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 border shrink-0 mt-0.5 ${
                      session.is_current
                        ? "bg-admin-action/10 border-admin-action/30 text-admin-action"
                        : "bg-admin-surface border-admin-border text-admin-foreground"
                    }`}
                  >
                    {device.type === "mobile" ? (
                      <Smartphone size={18} />
                    ) : (
                      <Laptop size={18} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-admin-foreground">
                        {device.name}
                      </span>
                      {session.is_current && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-admin-action/10 text-admin-action border border-admin-action/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-admin-action animate-pulse" />
                          {t("security.currentDeviceBadge")}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-admin-muted">
                      <span>IP: {session.ip_address || "-"}</span>
                      <span>•</span>
                      <span>
                        {t("security.lastActive")}:{" "}
                        {new Date(session.last_used_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant={session.is_current ? "outline" : "danger"}
                    size="sm"
                    onClick={() => handleOpenRevokeModal(session)}
                    icon={session.is_current ? <LogOut size={14} /> : <Trash2 size={14} />}
                  >
                    {t("security.revokeBtn")}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Revoke All Other Sessions Confirmation Modal */}
      {isRevokeOtherOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-overlay/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md bg-admin-surface border border-admin-border p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-admin-border">
              <h3 className="text-base font-semibold text-admin-danger flex items-center gap-2">
                <AlertTriangle size={18} />
                {t("security.revokeOtherModalTitle")}
              </h3>
              <button
                type="button"
                onClick={() => setIsRevokeOtherOpen(false)}
                className="text-admin-muted hover:text-admin-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-admin-muted leading-relaxed">
              {t("security.revokeOtherModalDesc", { count: otherSessionsCount })}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRevokeOtherOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isRevokingOther}
                onClick={handleRevokeOther}
              >
                {t("security.confirmRevokeAllOther")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Session Confirmation Modal */}
      {sessionToRevoke && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-overlay/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md bg-admin-surface border border-admin-border p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-admin-border">
              <h3 className="text-base font-semibold text-admin-danger flex items-center gap-2">
                <AlertTriangle size={18} />
                {t("security.revokeCurrentConfirmTitle")}
              </h3>
              <button
                type="button"
                onClick={() => setSessionToRevoke(null)}
                className="text-admin-muted hover:text-admin-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-admin-muted leading-relaxed">
              {t("security.revokeCurrentConfirmDesc")}
            </p>

            <div className="p-3 bg-admin-surface-muted border border-admin-border text-xs space-y-1">
              <div className="font-semibold text-admin-foreground">
                {parseDevice(sessionToRevoke.user_agent).name}
              </div>
              <div className="text-admin-muted">
                IP: {sessionToRevoke.ip_address || "-"} •{" "}
                {new Date(sessionToRevoke.last_used_at).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSessionToRevoke(null)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isRevokingSingle}
                onClick={handleConfirmRevokeSingle}
              >
                {t("security.confirmRevokeCurrent")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Logout Countdown Modal */}
      {isCountingDown && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-overlay/80 backdrop-blur-md animate-fade-in"
        >
          <div className="w-full max-w-sm bg-admin-surface border border-admin-border p-6 shadow-2xl text-center space-y-5 animate-scale-up">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-admin-danger/10 border-2 border-admin-danger flex items-center justify-center text-admin-danger animate-pulse">
                <span className="text-2xl font-bold font-mono">
                  {countdownSeconds}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-admin-foreground">
                {t("security.sessionRevokedModalTitle")}
              </h3>
              <p className="text-xs text-admin-muted leading-relaxed">
                {t("security.sessionRevokedModalDesc")}
              </p>
              <p className="text-xs text-admin-action font-semibold">
                {t("security.loggingOutIn", { seconds: countdownSeconds })}
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                variant="danger"
                size="md"
                className="w-full"
                onClick={handleFinalLogout}
                icon={<LogOut size={16} />}
              >
                {t("security.logoutNow")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
