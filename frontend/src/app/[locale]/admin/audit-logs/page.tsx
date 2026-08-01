"use client";

import React, { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { auditLogAdminService } from "@/services/auditLogService";
import type { AuditLog } from "@/types/auditLog";
import { Drawer } from "@/components/ui/Drawer";
import { Eye } from "lucide-react";
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

interface AuditLogFilters extends AdminFilterRecord {
  action: string[];
  entity_type: string[];
  from?: string;
  to?: string;
}

export default function AuditLogsPage() {
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

  const filterDefinitions: AdminFilterDefinition<AuditLogFilters>[] = [
    {
      key: "action",
      kind: "multi",
      label: "การทำงาน (Action)",
      options: (filterOptions?.actions || []).map((a) => ({ value: a, label: a.toUpperCase() })),
    },
    {
      key: "entity_type",
      kind: "multi",
      label: "ประเภทข้อมูล (Entity)",
      options: (filterOptions?.entity_types || []).map((e) => ({ value: e, label: e })),
    },
  ];

  const activeChips: AdminActiveFilterChip[] = [];
  for (const act of listState.params.filters.action || []) {
    activeChips.push({ key: "action", value: act, label: `Action: ${act}` });
  }
  for (const ent of listState.params.filters.entity_type || []) {
    activeChips.push({ key: "entity_type", value: ent, label: `Entity: ${ent}` });
  }
  if (listState.params.filters.from) {
    activeChips.push({ key: "from", value: listState.params.filters.from, label: `ตั้งแต่วันที่: ${listState.params.filters.from}` });
  }
  if (listState.params.filters.to) {
    activeChips.push({ key: "to", value: listState.params.filters.to, label: `ถึงวันที่: ${listState.params.filters.to}` });
  }

  const handleExportCsv = () => {
    exportToCsv(
      listQuery.rows,
      [
        { header: "ID", accessor: (item) => item.id },
        {
          header: "Date",
          accessor: (item) =>
            item.created_at ? new Date(item.created_at).toLocaleString("th-TH") : "",
        },
        { header: "User", accessor: (item) => item.user?.name || "System" },
        { header: "Action", accessor: (item) => item.action },
        { header: "Entity Type", accessor: (item) => item.entity_type },
        { header: "Entity ID", accessor: (item) => item.entity_id || "" },
        { header: "IP Address", accessor: (item) => item.ip_address || "" },
      ],
      "audit_logs_export"
    );
  };

  const columns: Column<AuditLog>[] = [
    {
      header: "วันที่",
      accessorKey: "created_at",
      cell: (v) => (v ? new Date(v as string).toLocaleString("th-TH") : "-"),
      sortable: true,
    },
    {
      header: "ผู้ใช้",
      accessorKey: "user",
      cell: (_, row) => (
        <div>
          {row.user?.name || "System"}
          <br />
          <span className="text-xs text-admin-muted">
            {row.user?.email || "-"}
          </span>
        </div>
      ),
    },
    {
      header: "การทำงาน",
      accessorKey: "action",
      sortable: true,
      cell: (v) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            v === "create"
              ? "bg-admin-success-surface text-admin-success"
              : v === "update"
                ? "bg-admin-selected text-admin-selected-foreground"
                : v === "delete"
                  ? "bg-admin-danger-surface text-admin-danger"
                  : "bg-admin-surface-muted text-admin-body"
          }`}
        >
          {(v as string)?.toUpperCase()}
        </span>
      ),
    },
    {
      header: "ข้อมูลอ้างอิง",
      accessorKey: "entity_type",
      sortable: true,
      cell: (_, row) => (
        <div>
          <span className="font-medium text-admin-body">{row.entity_type}</span>
          <br />
          <span
            className="text-xs text-admin-muted font-mono"
            title={row.entity_id}
          >
            {row.entity_id
              ? "ID: " + row.entity_id.substring(0, 8) + "..."
              : "-"}
          </span>
        </div>
      ),
    },
    {
      header: "เชื่อมต่อ (IP)",
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
          title="ดูรายละเอียด"
        >
          <Eye size={18} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Audit Logs"
        breadcrumbs={[{ label: "Audit Logs" }]}
      />

      <div className="mt-4">
        <AdminListToolbar
          activeFilterCount={activeChips.length}
          search={
            <AdminSearchInput
              value={listState.draftSearch}
              isDebouncing={listState.isDebouncing}
              onChange={(val) => listState.actions.setSearch(val)}
              onSubmit={(val) => listState.actions.setSearch(val, true)}
              onClear={() => listState.actions.setSearch("", true)}
            />
          }
          primaryFilters={
            <>
              <AdminMultiSelectFilter
                label="การทำงาน (Action)"
                options={filterDefinitions[0].options || []}
                values={listState.params.filters.action || []}
                onChange={(val) => listState.actions.setFilter("action", val)}
              />
              <AdminMultiSelectFilter
                label="ประเภทข้อมูล (Entity)"
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
                onRemove={(key, val) => listState.actions.removeFilterValue(key as keyof AuditLogFilters, val)}
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
            label="ช่วงวันที่"
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
          sorting={{ key: listState.params.sort || "created_at", order: listState.params.order }}
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
        title="รายละเอียด Audit Log"
        size="lg"
      >
        {selectedLog && (
          <div className="flex-1 overflow-y-auto p-6 bg-admin-canvas">
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-admin-surface p-4 rounded-lg border border-admin-border shadow-sm">
                  <p className="text-xs text-admin-muted mb-1">การทำงาน (Action)</p>
                  <p className="font-medium text-admin-foreground uppercase">
                    {selectedLog.action}
                  </p>
                </div>
                <div className="bg-admin-surface p-4 rounded-lg border border-admin-border shadow-sm">
                  <p className="text-xs text-admin-muted mb-1">วันที่ (Date)</p>
                  <p className="font-medium text-admin-foreground">
                    {new Date(selectedLog.created_at).toLocaleString("th-TH")}
                  </p>
                </div>
                <div className="bg-admin-surface p-4 rounded-lg border border-admin-border shadow-sm">
                  <p className="text-xs text-admin-muted mb-1">ข้อมูล (Entity)</p>
                  <p className="font-medium text-admin-foreground">
                    {selectedLog.entity_type}
                  </p>
                  <p className="text-xs text-admin-muted font-mono mt-1 break-all">
                    {selectedLog.entity_id}
                  </p>
                </div>
                <div className="bg-admin-surface p-4 rounded-lg border border-admin-border shadow-sm">
                  <p className="text-xs text-admin-muted mb-1">ผู้ทำรายการ (User)</p>
                  <p className="font-medium text-admin-foreground">
                    {selectedLog.user?.name || "System"}
                  </p>
                  <p className="text-xs text-admin-muted">
                    {selectedLog.user?.email || "No email"}
                  </p>
                </div>
              </div>

              {/* Network / Tracing */}
              <div className="bg-admin-surface p-4 rounded-lg border border-admin-border shadow-sm">
                <h3 className="text-sm font-semibold text-admin-foreground mb-3 pb-2 border-b border-admin-border">
                  ข้อมูลการเชื่อมต่อ & Tracing
                </h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="text-admin-muted w-24 shrink-0">IP Address</span>
                    <span className="font-mono text-admin-foreground">{selectedLog.ip_address || "-"}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                    <span className="text-admin-muted w-24 shrink-0">User Agent</span>
                    <span className="text-admin-foreground break-words flex-1">{selectedLog.user_agent || "-"}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="text-admin-muted w-24 shrink-0">Trace ID</span>
                    <span className="font-mono text-admin-foreground">{selectedLog.trace_id || "-"}</span>
                  </div>
                </div>
              </div>

              {/* JSON Changes */}
              <div className="bg-admin-surface rounded-lg border border-admin-border shadow-sm overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-admin-border bg-admin-surface-muted">
                  <h3 className="text-sm font-semibold text-admin-foreground">
                    รายละเอียดการเปลี่ยนแปลง (Changes)
                  </h3>
                </div>
                <div className="p-4 bg-admin-surface-muted text-admin-foreground font-mono text-xs overflow-x-auto">
                  <pre>
                    {selectedLog.changes
                      ? JSON.stringify(selectedLog.changes, null, 2)
                      : "{}"}
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
