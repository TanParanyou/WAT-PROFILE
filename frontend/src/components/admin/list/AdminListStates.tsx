"use client";

import React from "react";
import { SearchX, Inbox, AlertTriangle, RotateCcw, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

export interface AdminListEmptyStateProps {
  hasActiveQuery?: boolean;
  onClear?: () => void;
  onCreate?: () => void;
  createLabel?: string;
  title?: string;
  description?: string;
}

export function AdminListEmptyState({
  hasActiveQuery = false,
  onClear,
  onCreate,
  createLabel,
  title,
  description,
}: AdminListEmptyStateProps) {
  const t = useTranslations("admin.list");

  if (hasActiveQuery) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-admin-border rounded-none bg-admin-surface-muted/50">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-admin-selected text-admin-selected-foreground mb-3">
          <SearchX className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-admin-foreground">
          {title ?? t("noMatches")}
        </h3>
        <p className="mt-1 text-sm text-admin-muted max-w-sm">
          {description ?? "ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรองที่คุณเลือก"}
        </p>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="mt-4 inline-flex items-center gap-2 min-h-11 rounded-none bg-admin-surface px-4 py-2 text-sm font-medium text-admin-body border border-admin-control-border hover:bg-admin-surface-muted focus-visible:outline-2 focus-visible:outline-admin-focus transition-colors"
          >
            {t("clearAll")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-admin-border rounded-none bg-admin-surface-muted/50">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-admin-surface-muted text-admin-muted mb-3">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-admin-foreground">
        {title ?? t("empty")}
      </h3>
      <p className="mt-1 text-sm text-admin-muted max-w-sm">
        {description ?? "ยังไม่มีข้อมูลในระบบ"}
      </p>
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 inline-flex items-center gap-2 min-h-11 rounded-none bg-admin-action px-4 py-2 text-sm font-medium text-admin-on-action hover:bg-admin-action-hover focus-visible:outline-2 focus-visible:outline-admin-focus transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>{createLabel ?? "สร้างรายการใหม่"}</span>
        </button>
      )}
    </div>
  );
}

export interface AdminListErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function AdminListErrorState({
  message,
  onRetry,
}: AdminListErrorStateProps) {
  const t = useTranslations("admin.list");

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-admin-danger/20 rounded-none bg-admin-danger-surface/30">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-admin-danger-surface text-admin-danger mb-3">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-admin-foreground">
        เกิดข้อผิดพลาดในการโหลดข้อมูล
      </h3>
      <p className="mt-1 text-sm text-admin-danger max-w-md">
        {message ?? "ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง"}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 min-h-11 rounded-none bg-admin-danger px-4 py-2 text-sm font-medium text-admin-on-action hover:brightness-90 focus-visible:outline-2 focus-visible:outline-admin-focus transition-colors"
      >
        <RotateCcw className="h-4 w-4" />
        <span>{t("retry")}</span>
      </button>
    </div>
  );
}
