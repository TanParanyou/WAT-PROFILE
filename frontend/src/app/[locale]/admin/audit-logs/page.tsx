"use client";

import React, { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useDataTable } from "@/hooks/useDataTable";
import { auditLogAdminService } from "@/services/auditLogService";
import type { AuditLog } from "@/types/auditLog";
import { Drawer } from "@/components/ui/Drawer";
import { Eye } from "lucide-react";

export default function AuditLogsPage() {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, pagination, sort, isLoading, onPageChange, onSort } =
    useDataTable<AuditLog>({
      queryKey: "audit-logs",
      fetcher: (p) =>
        auditLogAdminService.getList({ page: p.page, limit: p.limit }),
    });

  const columns: Column<AuditLog>[] = [
    {
      header: "วันที่",
      accessorKey: "created_at",
      cell: (v) => (v ? new Date(v as string).toLocaleString("th-TH") : "-"),
      sortable: false,
    },
    {
      header: "ผู้ใช้",
      accessorKey: "user",
      cell: (_, row) => (
        <div>
          {row.user?.name || "System"}
          <br />
          <span className="text-xs text-gray-500">
            {row.user?.email || "-"}
          </span>
        </div>
      ),
    },
    {
      header: "การทำงาน",
      accessorKey: "action",
      cell: (v) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            v === "create"
              ? "bg-green-100 text-green-700"
              : v === "update"
                ? "bg-blue-100 text-blue-700"
                : v === "delete"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
          }`}
        >
          {(v as string)?.toUpperCase()}
        </span>
      ),
    },
    {
      header: "ข้อมูลอ้างอิง",
      accessorKey: "entity_type",
      cell: (_, row) => (
        <div>
          <span className="font-medium text-gray-700">{row.entity_type}</span>
          <br />
          <span
            className="text-xs text-gray-400 font-mono"
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
        <span className="text-sm font-mono text-gray-500">
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
          className="p-1.5 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
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

      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        sorting={sort}
        isLoading={isLoading}
        onPageChange={onPageChange}
        onSort={onSort}
        selectable={false}
      />

      <Drawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="รายละเอียด Audit Log"
        size="lg"
      >
        {selectedLog && (
          <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50">
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
                  <p className="text-xs text-zinc-500 mb-1">การทำงาน (Action)</p>
                  <p className="font-medium text-zinc-900 uppercase">
                    {selectedLog.action}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
                  <p className="text-xs text-zinc-500 mb-1">วันที่ (Date)</p>
                  <p className="font-medium text-zinc-900">
                    {new Date(selectedLog.created_at).toLocaleString("th-TH")}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
                  <p className="text-xs text-zinc-500 mb-1">ข้อมูล (Entity)</p>
                  <p className="font-medium text-zinc-900">
                    {selectedLog.entity_type}
                  </p>
                  <p className="text-xs text-zinc-400 font-mono mt-1 break-all">
                    {selectedLog.entity_id}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
                  <p className="text-xs text-zinc-500 mb-1">ผู้ทำรายการ (User)</p>
                  <p className="font-medium text-zinc-900">
                    {selectedLog.user?.name || "System"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {selectedLog.user?.email || "No email"}
                  </p>
                </div>
              </div>

              {/* Network / Tracing */}
              <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
                <h3 className="text-sm font-semibold text-zinc-900 mb-3 pb-2 border-b border-zinc-100">
                  ข้อมูลการเชื่อมต่อ & Tracing
                </h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="text-zinc-500 w-24 shrink-0">IP Address</span>
                    <span className="font-mono text-zinc-700">{selectedLog.ip_address || "-"}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                    <span className="text-zinc-500 w-24 shrink-0">User Agent</span>
                    <span className="text-zinc-700 break-words flex-1">{selectedLog.user_agent || "-"}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="text-zinc-500 w-24 shrink-0">Trace ID</span>
                    <span className="font-mono text-zinc-700">{selectedLog.trace_id || "-"}</span>
                  </div>
                </div>
              </div>

              {/* JSON Changes */}
              <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/80">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    รายละเอียดการเปลี่ยนแปลง (Changes)
                  </h3>
                </div>
                <div className="p-4 bg-zinc-950 text-zinc-300 font-mono text-xs overflow-x-auto">
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
