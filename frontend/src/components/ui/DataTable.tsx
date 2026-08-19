"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Loading } from "./Loading";
import { Checkbox } from "./Checkbox";
import { cn } from "@/utils/cn";
import type { SortState } from "@/hooks/useDataTable";
import type { AdminPagination, AdminPageSize } from "@/features/admin-list/types";
import { AdminPageSizeSelect } from "@/components/admin/list/AdminPageSizeSelect";

export interface Column<T> {
  id?: string;
  header: React.ReactNode;
  accessorKey?: keyof T;
  cell?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  sticky?: "left" | "right" | boolean;
  isAction?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pagination?: AdminPagination | { page: number; limit: number; totalPages: number; total?: number; totalItems?: number };
  sorting?: SortState;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: AdminPageSize) => void;
  onSort?: (key: string) => void;
  className?: string;
  hidePagination?: boolean;
  stickyActionColumn?: boolean;

  // Row selection props
  selectable?: boolean;
  selectedIds?: Set<string | number>;
  onSelect?: (id: string | number) => void;
  onSelectAll?: (ids: (string | number)[]) => void;
}

export function DataTable<T>({
  columns,
  data,
  pagination,
  sorting,
  isLoading = false,
  onPageChange,
  onLimitChange,
  onSort,
  className,
  hidePagination = false,
  stickyActionColumn = true,
  selectable = false,
  selectedIds = new Set(),
  onSelect,
  onSelectAll,
}: DataTableProps<T>) {
  const t = useTranslations("Admin.common.dataTable");
  const safeData = data || [];
  const page = pagination?.page || 1;
  const totalPages = pagination?.totalPages ?? 0;
  const limit = (pagination?.limit || 25) as AdminPageSize;
  const totalItems = pagination?.total ?? (pagination as { totalItems?: number })?.totalItems ?? safeData.length;
  const sortingState = sorting || { key: null, order: "asc" as const };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= 3; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (page >= totalPages - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 2; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      pages.push(page);
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const isRowSelected = (row: T): boolean => {
    const id = (row as Record<string, unknown>).id as string | number | undefined;
    return id !== undefined && selectedIds.has(id);
  };

  const isAllSelected =
    safeData.length > 0 &&
    safeData.every((row) => {
      const id = (row as Record<string, unknown>).id as string | number | undefined;
      return id !== undefined && selectedIds.has(id);
    });

  const isSomeSelected =
    safeData.length > 0 &&
    safeData.some((row) => {
      const id = (row as Record<string, unknown>).id as string | number | undefined;
      return id !== undefined && selectedIds.has(id);
    }) &&
    !isAllSelected;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectAll) return;
    if (e.target.checked) {
      const ids = safeData
        .map((row) => (row as Record<string, unknown>).id as string | number | undefined)
        .filter((id): id is string | number => id !== undefined);
      onSelectAll(ids);
    } else {
      onSelectAll([]);
    }
  };

  const getColumnStickyPosition = (
    col: Column<T>,
    colIdx: number,
    totalCols: number
  ): "left" | "right" | null => {
    // 1. Explicit sticky flag (highest priority)
    if (col.sticky === "left") return "left";
    if (col.sticky === "right" || col.sticky === true) return "right";
    if (col.sticky === false) return null;

    // 2. Explicit column identifier
    if (col.isAction) return "right";
    const colId = (col.id || (col.accessorKey as string) || "").toString().toLowerCase();
    if (colId === "actions" || colId === "action") return "right";

    // 3. Structural heuristic: Last column with custom cell renderer and no data accessorKey
    if (stickyActionColumn && colIdx === totalCols - 1 && !col.accessorKey && Boolean(col.cell)) {
      return "right";
    }

    // 4. Header text fallback (for string headers in TH / EN / DE)
    if (typeof col.header === "string") {
      const headerText = col.header.toLowerCase().trim();
      if (
        headerText === "จัดการ" ||
        headerText.includes("จัดการ") ||
        headerText === "actions" ||
        headerText === "action" ||
        headerText === "aktionen"
      ) {
        return "right";
      }
    }

    return null;
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="w-full rounded-none border border-admin-border bg-admin-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            {/* Header */}
            <thead className="border-b border-admin-border bg-admin-surface-muted text-xs uppercase text-admin-muted">
              <tr>
                {selectable && (
                  <th className="px-6 py-3 w-[50px]">
                    <Checkbox
                      checked={isAllSelected}
                      ref={(input: HTMLInputElement | null) => {
                        if (input) input.indeterminate = isSomeSelected;
                      }}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                {columns.map((col, idx) => {
                  const isSortable = col.sortable && col.accessorKey && onSort;
                  const isSorted = sortingState.key === col.accessorKey;
                  const stickyPos = getColumnStickyPosition(col, idx, columns.length);
                  const isStickyRight = stickyPos === "right";
                  const isStickyLeft = stickyPos === "left";

                  return (
                    <th
                      key={idx}
                      className={cn(
                        "px-6 py-3 font-medium whitespace-nowrap",
                        isSortable && "cursor-pointer hover:text-admin-foreground",
                        isStickyRight &&
                          "sticky right-0 z-20 bg-admin-surface-muted border-l border-admin-border shadow-[-2px_0_4px_rgba(0,0,0,0.05)]",
                        isStickyLeft &&
                          "sticky left-0 z-20 bg-admin-surface-muted border-r border-admin-border shadow-[2px_0_4px_rgba(0,0,0,0.05)]",
                        col.className,
                      )}
                      onClick={() =>
                        isSortable && onSort?.(col.accessorKey as string)
                      }
                    >
                      <div className="flex items-center gap-2">
                        {col.header}
                        {isSortable && (
                          <ArrowUpDown
                            className={cn(
                              "h-3 w-3",
                              isSorted ? "text-admin-action" : "opacity-30",
                            )}
                          />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-admin-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="h-48"
                  >
                    <div className="flex items-center justify-center h-full">
                      <Loading size="lg" text={t("loading")} />
                    </div>
                  </td>
                </tr>
              ) : safeData.length > 0 ? (
                safeData.map((row, rowIdx) => {
                  const rowObj = row as Record<string, unknown>;
                  const rowId = (rowObj.id as string | number | undefined) ?? rowIdx;
                  return (
                    <tr
                      key={rowId}
                      className={cn(
                        "group hover:bg-admin-surface-muted transition-colors",
                        isRowSelected(row) && "bg-admin-selected",
                      )}
                    >
                      {selectable && (
                        <td className="px-6 py-4">
                          <Checkbox
                            checked={isRowSelected(row)}
                            onChange={() => {
                              const id = rowObj.id as string | number | undefined;
                              if (id !== undefined) onSelect?.(id);
                            }}
                          />
                        </td>
                      )}
                      {columns.map((col, colIdx) => {
                        const stickyPos = getColumnStickyPosition(col, colIdx, columns.length);
                        const isStickyRight = stickyPos === "right";
                        const isStickyLeft = stickyPos === "left";

                        return (
                          <td
                            key={colIdx}
                            className={cn(
                              "px-6 py-4 whitespace-nowrap text-admin-body",
                              isStickyRight &&
                                cn(
                                  "sticky right-0 z-10 border-l border-admin-border shadow-[-2px_0_4px_rgba(0,0,0,0.05)]",
                                  isRowSelected(row)
                                    ? "bg-admin-selected"
                                    : "bg-admin-surface group-hover:bg-admin-surface-muted",
                                ),
                              isStickyLeft &&
                                cn(
                                  "sticky left-0 z-10 border-r border-admin-border shadow-[2px_0_4px_rgba(0,0,0,0.05)]",
                                  isRowSelected(row)
                                    ? "bg-admin-selected"
                                    : "bg-admin-surface group-hover:bg-admin-surface-muted",
                                ),
                              col.className,
                            )}
                          >
                            {col.cell
                              ? col.cell(
                                  col.accessorKey
                                    ? rowObj[col.accessorKey as string]
                                    : undefined,
                                  row,
                                )
                              : col.accessorKey
                                ? String(rowObj[col.accessorKey as string] ?? "")
                                : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="h-32 text-center text-admin-muted"
                  >
                    {t("noData")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!hidePagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-admin-border bg-admin-surface-muted px-6 py-3 gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-admin-muted">
              {totalItems > 0 ? (
                <span>
                  {t("showing")}{" "}
                  <span className="font-medium text-admin-foreground">
                    {(page - 1) * limit + 1}
                  </span>{" "}
                  {t("to")}{" "}
                  <span className="font-medium text-admin-foreground">
                    {Math.min(page * limit, totalItems)}
                  </span>{" "}
                  {t("of")}{" "}
                  <span className="font-medium text-admin-foreground">
                    {totalItems}
                  </span>{" "}
                  {t("entries")}
                </span>
              ) : (
                <span>{t("noEntries")}</span>
              )}

              {onLimitChange && (
                <AdminPageSizeSelect
                  value={limit}
                  onChange={onLimitChange}
                />
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange?.(1)}
                disabled={page === 1 || totalPages === 0 || isLoading}
                className="p-1.5 rounded border border-admin-control-border bg-admin-surface text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-admin-focus"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => onPageChange?.(page - 1)}
                disabled={page === 1 || totalPages === 0 || isLoading}
                className="p-1.5 rounded border border-admin-control-border bg-admin-surface text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-admin-focus"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {getPageNumbers().map((p, i) =>
                p === "..." ? (
                  <span key={i} className="px-2 text-admin-muted">
                    ...
                  </span>
                ) : (
                  <button
                    key={i}
                    onClick={() => onPageChange?.(p as number)}
                    className={cn(
                      "h-8 w-8 rounded text-sm focus-visible:outline-2 focus-visible:outline-admin-focus",
                      page === p
                        ? "bg-admin-action text-admin-on-action font-medium"
                        : "border border-admin-control-border bg-admin-surface text-admin-body hover:bg-admin-surface-muted",
                    )}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                onClick={() => onPageChange?.(page + 1)}
                disabled={page >= totalPages || totalPages === 0 || isLoading}
                className="p-1.5 rounded border border-admin-control-border bg-admin-surface text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-admin-focus"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onPageChange?.(totalPages)}
                disabled={page >= totalPages || totalPages === 0 || isLoading}
                className="p-1.5 rounded border border-admin-control-border bg-admin-surface text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-admin-focus"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
