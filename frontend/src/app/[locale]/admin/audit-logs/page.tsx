"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { auditLogAdminService } from "@/services/auditLogService";
import type { AuditLog } from "@/types/auditLog";
import { Drawer } from "@/components/ui/Drawer";
import { Eye, Shield, User, Globe, Activity, FileText } from "lucide-react";
import { useAdminListState } from "@/features/admin-list/useAdminListState";
import { useAdminListQuery } from "@/features/admin-list/useAdminListQuery";
import type { AdminFilterRecord, AdminFilterDefinition } from "@/features/admin-list/types";
import { AdminListToolbar } from "@/components/admin/list/AdminListToolbar";
import { AdminSearchInput } from "@/components/admin/list/AdminSearchInput";
import { AdminMultiSelectFilter } from "@/components/admin/list/AdminMultiSelectFilter";
import { AdminDateRangeFilter } from "@/components/admin/list/AdminDateRangeFilter";
import { AdminActiveFilterChips, type AdminActiveFilterChip } from "@/components/admin/list/AdminActiveFilterChips";
import { AdminListExportButton } from "@/components/admin/list/AdminListExportButton";
import { exportToCsv } from "@/services/adminListExportService";
import { useQuery } from "@tanstack/react-query";
import { useDateFormat } from "@/hooks/useDateFormat";

interface AuditLogFilters extends AdminFilterRecord {
  action: string[];
  entity_type: string[];
  from?: string;
  to?: string;
}

export default function AuditLogsPage() {
  const t = useTranslations("Admin.auditLogs");
  const { formatDateTime } = useDateFormat();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const listState = useAdminListState<AuditLogFilters>({
    schema: {
      defaultSort: "created_at",
      defaultOrder: "desc",
      multi: ["action", "entity_type"],
      single: ["from", "to"],
      allowedSorts: ["id", "action", "entity_type", "created_at"],
    },
  });

  const listQuery = useAdminListQuery<AuditLog, AuditLogFilters>({
    queryKey: ["admin", "audit-logs"],
    params: listState.params,
    fetcher: (params) => auditLogAdminService.getPaginated(params),
    setPage: listState.actions.setPage,
  });

  const { data: filterOptions } = useQuery({
    queryKey: ["admin", "audit-logs", "filter-options"],
    queryFn: () => auditLogAdminService.getFilterOptions(),
  });

  const formatKeyToFallbackLabel = (key: string) => {
    return key
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getActionShortLabel = (action: string): string => {
    const normalizedKey = action.replace(/\./g, "_");
    const translationKey = `actions.${normalizedKey}`;
    return t.has(translationKey) ? t(translationKey) : formatKeyToFallbackLabel(action);
  };

  const getActionOptionLabel = (action: string): string => {
    const shortLabel = getActionShortLabel(action);
    return `${shortLabel} (${action})`;
  };

  const getActionBadgeStyle = (action: string): string => {
    const normalized = action.toLowerCase();
    if (
      normalized.includes("create") ||
      normalized.includes("restore") ||
      normalized.includes("login.success") ||
      normalized.includes("enable")
    ) {
      return "bg-admin-success-surface text-admin-success border-admin-success/30";
    }
    if (
      normalized.includes("update") ||
      normalized.includes("duplicate") ||
      normalized.includes("reorder") ||
      normalized.includes("publish") ||
      normalized.includes("verified") ||
      normalized.includes("items_selected")
    ) {
      return "bg-admin-selected text-admin-selected-foreground border-admin-action/30";
    }
    if (
      normalized.includes("delete") ||
      normalized.includes("archive") ||
      normalized.includes("disable") ||
      normalized.includes("lock") ||
      normalized.includes("failure") ||
      normalized.includes("denied") ||
      normalized.includes("reject")
    ) {
      return "bg-admin-danger-surface text-admin-danger border-admin-danger/30";
    }
    return "bg-admin-surface-muted text-admin-body border-admin-border";
  };

  const getEntityShortLabel = (entity: string): string => {
    const normalizedKey = entity.replace(/\./g, "_");
    const translationKey = `entities.${normalizedKey}`;
    return t.has(translationKey) ? t(translationKey) : formatKeyToFallbackLabel(entity);
  };

  const getEntityOptionLabel = (entity: string): string => {
    const shortLabel = getEntityShortLabel(entity);
    return `${shortLabel} (${entity})`;
  };

  const filterDefinitions: AdminFilterDefinition<AuditLogFilters>[] = [
    {
      key: "action",
      kind: "multi",
      label: t("filters.action"),
      options: (filterOptions?.actions || []).map((a) => ({
        value: a,
        label: getActionOptionLabel(a),
      })),
    },
    {
      key: "entity_type",
      kind: "multi",
      label: t("filters.entityType"),
      options: (filterOptions?.entity_types || []).map((e) => ({
        value: e,
        label: getEntityOptionLabel(e),
      })),
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const act of listState.params.filters.action || []) {
    activeChips.push({
      key: "action",
      value: act,
      label: t("filters.actionChip", { label: getActionShortLabel(act) }),
    });
  }
  for (const ent of listState.params.filters.entity_type || []) {
    activeChips.push({
      key: "entity_type",
      value: ent,
      label: t("filters.entityChip", { label: getEntityShortLabel(ent) }),
    });
  }
  if (listState.params.filters.from) {
    activeChips.push({
      key: "from",
      value: listState.params.filters.from,
      label: t("filters.fromChip", { date: listState.params.filters.from }),
    });
  }
  if (listState.params.filters.to) {
    activeChips.push({
      key: "to",
      value: listState.params.filters.to,
      label: t("filters.toChip", { date: listState.params.filters.to }),
    });
  }

  const handleExportCsv = () => {
    exportToCsv(
      listQuery.rows,
      [
        { header: t("export.headers.id"), accessor: (item) => item.id },
        {
          header: t("export.headers.date"),
          accessor: (item) => (item.created_at ? formatDateTime(item.created_at) : ""),
        },
        { header: t("export.headers.user"), accessor: (item) => item.user?.name || t("drawer.system") },
        { header: t("export.headers.userEmail"), accessor: (item) => item.user?.email || "" },
        { header: t("export.headers.action"), accessor: (item) => item.action },
        { header: t("export.headers.actionLabel"), accessor: (item) => getActionShortLabel(item.action) },
        { header: t("export.headers.entityType"), accessor: (item) => item.entity_type },
        { header: t("export.headers.entityLabel"), accessor: (item) => getEntityShortLabel(item.entity_type) },
        { header: t("export.headers.entityId"), accessor: (item) => item.entity_id || "" },
        { header: t("export.headers.ipAddress"), accessor: (item) => item.ip_address || "" },
        { header: t("export.headers.traceId"), accessor: (item) => item.trace_id || "" },
      ],
      t("export.filename")
    );
  };

  const columns: Column<AuditLog>[] = [
    {
      header: t("columns.date"),
      accessorKey: "created_at",
      cell: (v) => (v ? formatDateTime(v as string) : "-"),
      sortable: true,
    },
    {
      header: t("columns.user"),
      accessorKey: "user",
      cell: (_, row) => (
        <div>
          <span className="font-medium text-admin-body">
            {row.user?.name || t("drawer.system")}
          </span>
          <br />
          <span className="text-xs text-admin-muted">
            {row.user?.email || "-"}
          </span>
        </div>
      ),
    },
    {
      header: t("columns.action"),
      accessorKey: "action",
      sortable: true,
      cell: (v) => {
        const actionStr = (v as string) || "";
        const label = getActionShortLabel(actionStr);
        const styleClass = getActionBadgeStyle(actionStr);
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${styleClass}`}
            >
              {label}
            </span>
            <span className="text-[11px] text-admin-muted font-mono" title={actionStr}>
              {actionStr}
            </span>
          </div>
        );
      },
    },
    {
      header: t("columns.entity"),
      accessorKey: "entity_type",
      sortable: true,
      cell: (_, row) => {
        const entityLabel = getEntityShortLabel(row.entity_type);
        return (
          <div>
            <span className="font-medium text-admin-body">
              {entityLabel}
            </span>
            <span className="ml-1 text-xs text-admin-muted">
              ({row.entity_type})
            </span>
            <br />
            <span
              className="text-xs text-admin-muted font-mono"
              title={row.entity_id}
            >
              {row.entity_id
                ? "ID: " + (row.entity_id.length > 16 ? row.entity_id.substring(0, 12) + "..." : row.entity_id)
                : "-"}
            </span>
          </div>
        );
      },
    },
    {
      header: t("columns.ip"),
      accessorKey: "ip_address",
      cell: (v) => (
        <span className="text-sm font-mono text-admin-muted">
          {(v as string) || "-"}
        </span>
      ),
    },
    {
      header: "",
      className: "w-[80px] text-right",
      cell: (_, row) => (
        <button
          onClick={() => setSelectedLog(row)}
          className="p-1.5 text-admin-muted hover:text-admin-action hover:bg-admin-surface-muted rounded transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
          title={t("columns.viewDetail")}
          aria-label={t("columns.viewDetail")}
        >
          <Eye size={18} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={t("title")}
        breadcrumbs={[{ label: t("breadcrumb") }]}
      />

      <div className="mt-4">
        <AdminListToolbar
          activeFilterCount={activeChips.length}
          search={
            <AdminSearchInput
              value={listState.draftSearch}
              isDebouncing={listState.isDebouncing}
              placeholder={t("searchPlaceholder")}
              onChange={(val) => listState.actions.setSearch(val)}
              onSubmit={(val) => listState.actions.setSearch(val, true)}
              onClear={() => listState.actions.setSearch("", true)}
            />
          }
          primaryFilters={
            <>
              <AdminMultiSelectFilter
                label={t("filters.action")}
                options={filterDefinitions[0].options || []}
                values={listState.params.filters.action || []}
                onChange={(val) => listState.actions.setFilter("action", val)}
              />
              <AdminMultiSelectFilter
                label={t("filters.entityType")}
                options={filterDefinitions[1].options || []}
                values={listState.params.filters.entity_type || []}
                onChange={(val) => listState.actions.setFilter("entity_type", val)}
              />
            </>
          }
          activeFilters={
            <div className="flex items-center justify-between">
              <AdminActiveFilterChips
                filters={activeChips}
                onRemove={(key, val) =>
                  listState.actions.removeFilterValue(key as keyof AuditLogFilters, val)
                }
                onClear={listState.actions.clearFilters}
              />
              <AdminListExportButton
                isExporting={false}
                completed={0}
                total={listQuery.pagination.total}
                onExport={handleExportCsv}
              />
            </div>
          }
        >
          <AdminDateRangeFilter
            label={t("filters.dateRange")}
            from={listState.params.filters.from}
            to={listState.params.filters.to}
            onChange={({ from, to }) => {
              listState.actions.setFilters({
                from: from,
                to: to,
              });
            }}
          />
        </AdminListToolbar>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={listQuery.rows}
          pagination={listQuery.pagination}
          sorting={{
            key: listState.params.sort || "created_at",
            order: listState.params.order,
          }}
          isLoading={listQuery.isLoading}
          onPageChange={listState.actions.setPage}
          onLimitChange={listState.actions.setLimit}
          onSort={(field) => listState.actions.setSort(field)}
          selectable={false}
        />
      </div>

      <Drawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={t("drawer.title")}
        size="lg"
      >
        {selectedLog && (
          <div className="flex-1 overflow-y-auto p-6 bg-admin-canvas">
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-admin-surface p-4 border border-admin-border shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs text-admin-muted mb-1.5">
                    <Activity size={14} />
                    <span>{t("drawer.action")}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${getActionBadgeStyle(
                        selectedLog.action
                      )}`}
                    >
                      {getActionShortLabel(selectedLog.action)}
                    </span>
                    <span className="text-xs font-mono text-admin-muted">
                      ({selectedLog.action})
                    </span>
                  </div>
                </div>

                <div className="bg-admin-surface p-4 border border-admin-border shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs text-admin-muted mb-1.5">
                    <Globe size={14} />
                    <span>{t("drawer.date")}</span>
                  </div>
                  <p className="font-medium text-admin-foreground">
                    {formatDateTime(selectedLog.created_at)}
                  </p>
                </div>

                <div className="bg-admin-surface p-4 border border-admin-border shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs text-admin-muted mb-1.5">
                    <FileText size={14} />
                    <span>{t("drawer.entity")}</span>
                  </div>
                  <p className="font-medium text-admin-foreground">
                    {getEntityShortLabel(selectedLog.entity_type)}
                    <span className="text-xs font-normal text-admin-muted ml-1">
                      ({selectedLog.entity_type})
                    </span>
                  </p>
                  <p className="text-xs text-admin-muted font-mono mt-1 break-all">
                    {selectedLog.entity_id ? `ID: ${selectedLog.entity_id}` : "-"}
                  </p>
                </div>

                <div className="bg-admin-surface p-4 border border-admin-border shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs text-admin-muted mb-1.5">
                    <User size={14} />
                    <span>{t("drawer.user")}</span>
                  </div>
                  <p className="font-medium text-admin-foreground">
                    {selectedLog.user?.name || t("drawer.system")}
                  </p>
                  <p className="text-xs text-admin-muted">
                    {selectedLog.user?.email || t("drawer.noEmail")}
                  </p>
                </div>
              </div>

              {/* Network / Tracing */}
              <div className="bg-admin-surface p-4 border border-admin-border shadow-sm">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-admin-border">
                  <Shield size={16} className="text-admin-muted" />
                  <h3 className="text-sm font-semibold text-admin-foreground">
                    {t("drawer.networkSection")}
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="text-admin-muted w-28 shrink-0">
                      {t("drawer.ipAddress")}
                    </span>
                    <span className="font-mono text-admin-foreground">
                      {selectedLog.ip_address || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                    <span className="text-admin-muted w-28 shrink-0">
                      {t("drawer.userAgent")}
                    </span>
                    <span className="text-admin-foreground break-words flex-1 font-mono text-xs">
                      {selectedLog.user_agent || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="text-admin-muted w-28 shrink-0">
                      {t("drawer.traceId")}
                    </span>
                    <span className="font-mono text-admin-foreground text-xs">
                      {selectedLog.trace_id || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* JSON Changes */}
              <div className="bg-admin-surface border border-admin-border shadow-sm overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-admin-border bg-admin-surface-muted flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-admin-foreground">
                    {t("drawer.changesSection")}
                  </h3>
                </div>
                <div className="p-4 bg-admin-surface-muted text-admin-foreground font-mono text-xs overflow-x-auto">
                  <pre>
                    {selectedLog.changes && Object.keys(selectedLog.changes).length > 0
                      ? JSON.stringify(selectedLog.changes, null, 2)
                      : t("drawer.noChanges")}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
