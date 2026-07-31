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
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100/60 text-amber-700 mb-3">
          <SearchX className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          {title ?? t("noMatches")}
        </h3>
        <p className="mt-1 text-sm text-gray-500 max-w-sm">
          {description ?? "ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรองที่คุณเลือก"}
        </p>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
          >
            {t("clearAll")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-3">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">
        {title ?? t("empty")}
      </h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">
        {description ?? "ยังไม่มีข้อมูลในระบบ"}
      </p>
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
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
    <div className="flex flex-col items-center justify-center p-12 text-center border border-red-200 rounded-lg bg-red-50/30">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">
        เกิดข้อผิดพลาดในการโหลดข้อมูล
      </h3>
      <p className="mt-1 text-sm text-red-600 max-w-md">
        {message ?? "ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง"}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
      >
        <RotateCcw className="h-4 w-4" />
        <span>{t("retry")}</span>
      </button>
    </div>
  );
}
