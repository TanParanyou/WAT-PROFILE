"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle, Clock3, LogOut, ShieldOff, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import {
  useAdminAccountEvents,
  useDisableAdminAccount,
  useEnableAdminAccount,
  useLogoutAllAdminAccount,
} from "../queries";
import type {
  AccountOperationReason,
  AdminAccountSecurityEvent,
  AdminAccountStatus,
  AdminAccountSummary,
} from "../types";

interface AccountOperationsDetailPanelProps {
  account: AdminAccountSummary;
  onClose(): void;
}

type PendingAction = "disable" | "enable" | "logoutAll";

const reasons: AccountOperationReason[] = [
  "security_review",
  "policy_violation",
  "user_request",
  "support_request",
];

const eventParams = {
  page: 1,
  limit: 10 as const,
  search: "",
  sort: "created_at",
  order: "desc" as const,
  filters: {},
};

export function AccountOperationsDetailPanel({ account, onClose }: AccountOperationsDetailPanelProps) {
  const t = useTranslations("Admin.accounts");
  const common = useTranslations("Admin.common");
  const locale = useLocale();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const reasonRef = useRef<HTMLSelectElement>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState<AccountOperationReason | "">("");
  const eventsQuery = useAdminAccountEvents(account.id, eventParams);
  const disableMutation = useDisableAdminAccount();
  const enableMutation = useEnableAdminAccount();
  const logoutAllMutation = useLogoutAllAdminAccount();

  useEffect(() => {
    if (pendingAction) {
      reasonRef.current?.focus();
    }
  }, [pendingAction]);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }),
    [locale],
  );

  const statusLabels: Record<AdminAccountStatus, string> = {
    active: t("statuses.active"),
    disabled: t("statuses.disabled"),
    closed: t("statuses.closed"),
    pending_verification: t("statuses.pending_verification"),
  };

  const statusVariant = account.account_status === "active"
    ? "success"
    : account.account_status === "disabled"
      ? "warning"
      : account.account_status === "closed"
        ? "danger"
        : "default";

  const closeActionModal = () => {
    if (!disableMutation.isPending && !enableMutation.isPending && !logoutAllMutation.isPending) {
      setPendingAction(null);
      setReason("");
    }
  };

  const confirmAction = async () => {
    if (!pendingAction || !reason) return;
    try {
      if (pendingAction === "disable") {
        await disableMutation.mutateAsync({ id: account.id, reason });
        toast.success(t("actions.disable.success"));
      } else if (pendingAction === "enable") {
        await enableMutation.mutateAsync({ id: account.id, reason });
        toast.success(t("actions.enable.success"));
      } else {
        await logoutAllMutation.mutateAsync({ id: account.id, reason });
        toast.success(t("actions.logoutAll.success"));
      }
      closeActionModal();
    } catch (error: unknown) {
      handleApiError(error, undefined, t("errors.action"));
    }
  };

  const actionCopy = pendingAction ? t(`actions.${pendingAction}.title`) : "";
  const actionBody = pendingAction ? t(`actions.${pendingAction}.body`, { email: account.email }) : "";
  const isActionPending = disableMutation.isPending || enableMutation.isPending || logoutAllMutation.isPending;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden="true" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-admin-border bg-admin-surface shadow-2xl" aria-label={t("detail")}>
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-admin-border px-5">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-admin-muted">{t("detail")}</p>
            <h2 className="truncate text-lg font-semibold text-admin-foreground">{account.display_name || account.email}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={common("cancel")} className="flex min-h-11 min-w-11 items-center justify-center text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={statusLabels[account.account_status]} variant={statusVariant} />
              <span className="text-sm text-admin-muted">{account.email_verified ? t("verified") : t("unverified")}</span>
            </div>
            <p className="break-all text-sm text-admin-body">{account.email}</p>
            <div className="flex flex-wrap gap-2">
              {account.providers.map((provider) => (
                <span key={provider} className="border border-admin-border px-2 py-1 text-xs text-admin-body">{t(`providers.${provider}`)}</span>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 border-y border-admin-border py-4 text-sm sm:grid-cols-2">
            <InfoItem label={t("columns.lastLogin")} value={account.last_login_at ? dateFormatter.format(new Date(account.last_login_at)) : "—"} />
            <InfoItem label={t("columns.created")} value={dateFormatter.format(new Date(account.created_at))} />
            {account.closed_at && <InfoItem label={t("statuses.closed")} value={dateFormatter.format(new Date(account.closed_at))} />}
            {account.purge_after && <InfoItem label={t("purgeAfter")} value={dateFormatter.format(new Date(account.purge_after))} />}
          </section>

          <PermissionGuard resource="account_operations" action="update">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-admin-foreground">{t("columns.actions")}</h3>
              <div className="flex flex-wrap gap-2">
                {account.account_status === "active" && (
                  <Button variant="danger" size="sm" icon={<ShieldOff size={15} />} onClick={() => setPendingAction("disable")}>
                    {t("actions.disable.label")}
                  </Button>
                )}
                {account.account_status === "disabled" && account.email_verified && (
                  <Button variant="primary" size="sm" icon={<CheckCircle size={15} />} onClick={() => setPendingAction("enable")}>
                    {t("actions.enable.label")}
                  </Button>
                )}
                {(account.account_status === "active" || account.account_status === "disabled") && (
                  <Button variant="outline" size="sm" icon={<LogOut size={15} />} onClick={() => setPendingAction("logoutAll")}>
                    {t("actions.logoutAll.label")}
                  </Button>
                )}
              </div>
              {account.account_status === "closed" && <p className="text-xs text-admin-muted">{t("closedPolicy")}</p>}
              {account.account_status === "pending_verification" && <p className="text-xs text-admin-muted">{t("pendingPolicy")}</p>}
            </section>
          </PermissionGuard>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-admin-foreground">{t("securityEvents")}</h3>
              <span className="text-xs text-admin-muted">{eventsQuery.pagination.total}</span>
            </div>
            <p className="border border-admin-border bg-admin-surface-muted p-3 text-xs text-admin-muted">{t("redactionNotice")}</p>
            {eventsQuery.isLoading && <p className="text-sm text-admin-muted">{common("loading")}</p>}
            {eventsQuery.isError && <p className="text-sm text-admin-danger">{t("errors.load")}</p>}
            {!eventsQuery.isLoading && !eventsQuery.isError && eventsQuery.rows.length === 0 && <p className="text-sm text-admin-muted">{t("noEvents")}</p>}
            <div className="space-y-2">
              {eventsQuery.rows.map((event) => <SecurityEventRow key={event.id} event={event} formatter={dateFormatter} />)}
            </div>
          </section>
        </div>
      </aside>

      <Modal
        isOpen={Boolean(pendingAction)}
        onClose={closeActionModal}
        title={actionCopy}
        description={actionBody}
        size="sm"
        closeOnOverlayClick={!isActionPending}
        closeOnEscape={!isActionPending}
        footer={(
          <>
            <Button variant="outline" onClick={closeActionModal} disabled={isActionPending}>{common("cancel")}</Button>
            <Button variant={pendingAction === "disable" ? "danger" : "primary"} onClick={() => void confirmAction()} disabled={!reason || isActionPending} isLoading={isActionPending}>
              {pendingAction ? t(`actions.${pendingAction}.label`) : common("save")}
            </Button>
          </>
        )}
      >
        <label htmlFor="account-operation-reason" className="block text-sm font-medium text-admin-body">{t("reasonsLabel")}</label>
        <select
          ref={reasonRef}
          id="account-operation-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value as AccountOperationReason | "")}
          className="mt-2 min-h-11 w-full border border-admin-control-border bg-admin-surface px-3 text-sm text-admin-foreground focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-admin-focus"
        >
          <option value="">{t("selectReason")}</option>
          {reasons.map((value) => <option key={value} value={value}>{t(`reasons.${value}`)}</option>)}
        </select>
        <div className="mt-4 flex items-start gap-2 text-xs text-admin-muted"><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{t("redactionNotice")}</span></div>
      </Modal>
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-admin-muted">{label}</dt><dd className="mt-1 text-admin-body">{value}</dd></div>;
}

function SecurityEventRow({ event, formatter }: { event: AdminAccountSecurityEvent; formatter: Intl.DateTimeFormat }) {
  return <div className="flex items-start gap-3 border-b border-admin-border py-2.5 last:border-b-0"><Clock3 size={15} className="mt-0.5 shrink-0 text-admin-muted" /><div className="min-w-0"><p className="text-sm text-admin-body">{event.event_type} <span className="text-admin-muted">· {event.outcome}</span></p><p className="text-xs text-admin-muted">{event.provider || "—"} · {formatter.format(new Date(event.created_at))}</p></div></div>;
}
