"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useDataTable } from "@/hooks/useDataTable";
import { auditLogAdminService } from "@/services/auditLogService";
import type { AuditLog } from "@/types/auditLog";

export default function AuditLogsPage() {
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
    </div>
  );
}
