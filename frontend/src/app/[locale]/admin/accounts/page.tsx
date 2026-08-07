"use client";

import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { AdminListToolbar } from "@/components/admin/list/AdminListToolbar";
import { AdminSearchInput } from "@/components/admin/list/AdminSearchInput";
import { AdminMultiSelectFilter } from "@/components/admin/list/AdminMultiSelectFilter";
import { AdminActiveFilterChips, type AdminActiveFilterChip } from "@/components/admin/list/AdminActiveFilterChips";
import { useAdminListState } from "@/features/admin-list/useAdminListState";
import { useAdminListQuery } from "@/features/admin-list/useAdminListQuery";
import type { AdminFilterDefinition } from "@/features/admin-list/types";
import { accountOperationsAdminService } from "@/services/accountOperationsAdminService";
import { adminAccountKeys, useAdminAccountDetail } from "@/features/admin-accounts/queries";
import { AccountOperationsDetailPanel } from "@/features/admin-accounts/components/AccountOperationsDetailPanel";
import type { AccountFilters, AdminAccountStatus, AdminAccountSummary } from "@/features/admin-accounts/types";

const statusValues: AdminAccountStatus[] = ["pending_verification", "active", "disabled", "closed"];
const providerValues = ["password", "google"] as const;

export default function AdminAccountsPage() {
  const t = useTranslations("Admin.accounts");
  const locale = useLocale();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listState = useAdminListState<AccountFilters>({
    schema: {
      defaultSort: "created_at",
      defaultOrder: "desc",
      multi: ["status", "provider"],
      allowedSorts: ["created_at", "last_login_at", "email", "display_name", "purge_after"],
    },
  });

  const listQuery = useAdminListQuery<AdminAccountSummary, AccountFilters>({
    queryKey: adminAccountKeys.all,
    params: listState.params,
    fetcher: (params) => accountOperationsAdminService.getPaginated(params),
    setPage: listState.actions.setPage,
  });

  const statusLabels: Record<AdminAccountStatus, string> = {
    active: t("statuses.active"),
    disabled: t("statuses.disabled"),
    closed: t("statuses.closed"),
    pending_verification: t("statuses.pending_verification"),
  };

  const statusVariant = (status: AdminAccountStatus) => {
    if (status === "active") return "success" as const;
    if (status === "disabled") return "warning" as const;
    if (status === "closed") return "danger" as const;
    return "default" as const;
  };

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Europe/Berlin" }),
    [locale],
  );

  const filterDefinitions: AdminFilterDefinition<AccountFilters>[] = [
    {
      key: "status",
      kind: "multi",
      label: t("statusFilter"),
      options: statusValues.map((value) => ({ value, label: statusLabels[value] })),
    },
    {
      key: "provider",
      kind: "multi",
      label: t("providerFilter"),
      options: providerValues.map((value) => ({ value, label: t(`providers.${value}`) })),
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [
    ...(listState.params.filters.status || []).map((value) => ({ key: "status", value, label: `${t("statusFilter")}: ${statusLabels[value as AdminAccountStatus] || value}` })),
    ...(listState.params.filters.provider || []).map((value) => ({ key: "provider", value, label: `${t("providerFilter")}: ${value === "password" || value === "google" ? t(`providers.${value}`) : value}` })),
  ];

  const columns: Column<AdminAccountSummary>[] = [
    {
      header: t("columns.account"),
      accessorKey: "display_name",
      sortable: true,
      cell: (_, row) => <div className="min-w-48"><p className="font-medium text-admin-foreground">{row.display_name || "—"}</p><p className="break-all text-xs text-admin-muted">{row.email}</p></div>,
    },
    {
      header: t("columns.status"),
      accessorKey: "account_status",
      sortable: true,
      cell: (value) => { const status = String(value) as AdminAccountStatus; return <StatusBadge label={statusLabels[status] || status} variant={statusVariant(status)} />; },
    },
    {
      header: t("columns.provider"),
      accessorKey: "providers",
      cell: (value) => <div className="flex flex-wrap gap-1">{Array.isArray(value) ? value.map((provider) => <span key={String(provider)} className="text-xs text-admin-body">{t(`providers.${String(provider)}`)} </span>) : "—"}</div>,
    },
    {
      header: t("columns.lastLogin"),
      accessorKey: "last_login_at",
      sortable: true,
      cell: (value) => value ? dateFormatter.format(new Date(String(value))) : "—",
    },
    {
      header: t("columns.created"),
      accessorKey: "created_at",
      sortable: true,
      cell: (value) => dateFormatter.format(new Date(String(value))),
    },
    {
      header: t("columns.actions"),
      className: "w-20",
      cell: (_, row) => <button type="button" onClick={() => setSelectedId(row.id)} title={t("view")} aria-label={t("view")} className="flex min-h-11 min-w-11 items-center justify-center text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus"><Eye size={17} /></button>,
    },
  ];

  return (
    <PermissionGuard resource="account_operations" action="read" fallback={<div className="border border-admin-border bg-admin-surface p-6 text-sm text-admin-muted">{t("errors.forbidden")}</div>}>
      <div>
        <AdminPageHeader title={t("title")} breadcrumbs={[{ label: t("title") }]} />
        <p className="-mt-3 mb-5 max-w-3xl text-sm text-admin-muted">{t("description")}</p>

        <AdminListToolbar
          activeFilterCount={activeChips.length}
          search={<AdminSearchInput value={listState.draftSearch} isDebouncing={listState.isDebouncing} onChange={(value) => listState.actions.setSearch(value)} onSubmit={(value) => listState.actions.setSearch(value, true)} onClear={() => listState.actions.setSearch("", true)} />}
          primaryFilters={<>{filterDefinitions.map((filter) => <AdminMultiSelectFilter key={filter.key} label={filter.label} options={filter.options || []} values={(listState.params.filters[filter.key] as string[] | undefined) || []} onChange={(values) => listState.actions.setFilter(filter.key, values)} />)}</>}
          activeFilters={<AdminActiveFilterChips filters={activeChips} onRemove={(key, value) => listState.actions.removeFilterValue(key as keyof AccountFilters, value)} onClear={listState.actions.clearFilters} />}
        />

        <div className="mt-6">
          {listQuery.isError ? <div className="border border-admin-danger bg-admin-danger-surface p-4 text-sm text-admin-danger">{t("errors.load")}</div> : <DataTable columns={columns} data={listQuery.rows} pagination={listQuery.pagination} sorting={{ key: listState.params.sort || "created_at", order: listState.params.order }} isLoading={listQuery.isLoading} onPageChange={listState.actions.setPage} onLimitChange={listState.actions.setLimit} onSort={(field) => listState.actions.setSort(field)} />}
        </div>

        {selectedId && <SelectedAccountPanel id={selectedId} onClose={() => setSelectedId(null)} />}
      </div>
    </PermissionGuard>
  );
}

function SelectedAccountPanel({ id, onClose }: { id: string; onClose(): void }) {
  const t = useTranslations("Admin.accounts");
  const common = useTranslations("Admin.common");
  const query = useAdminAccountDetail(id);
  if (query.isLoading) return <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl items-center justify-center border-l border-admin-border bg-admin-surface text-sm text-admin-muted">{common("loading")}</div>;
  if (query.isError || !query.data) return <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-admin-border bg-admin-surface p-5"><button type="button" onClick={onClose} className="self-end min-h-11 min-w-11 text-admin-muted focus-visible:outline-2 focus-visible:outline-admin-focus">×</button><p className="mt-4 text-sm text-admin-danger">{t("errors.load")}</p></div>;
  return <AccountOperationsDetailPanel account={query.data} onClose={onClose} />;
}
