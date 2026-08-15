"use client";

import React from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import type { PermissionAction, PermissionResource } from "@/types/auth";

export interface BulkActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "success" | "muted" | "danger";
  resource?: PermissionResource;
  action?: PermissionAction;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
}

export function BulkActionButton({
  icon,
  label,
  onClick,
  variant = "default",
  resource,
  action,
  disabled,
  className = "",
  showLabel = false,
}: BulkActionButtonProps) {
  const variantStyles = {
    default: "bg-admin-surface hover:bg-admin-surface-muted text-admin-foreground border-admin-border",
    success: "bg-admin-surface hover:bg-admin-surface-muted text-admin-success border-admin-border",
    muted: "bg-admin-surface hover:bg-admin-surface-muted text-admin-muted border-admin-border",
    danger: "bg-admin-danger hover:brightness-90 text-admin-on-action border-transparent",
  };

  const button = (
    <div className="relative group/btn flex items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={`flex items-center justify-center min-w-[38px] min-h-[38px] w-[38px] h-[38px] sm:min-w-10 sm:min-h-10 sm:w-10 sm:h-10 p-2 rounded-none border transition-colors shrink-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-admin-focus ${variantStyles[variant]} ${
          showLabel ? "w-auto sm:w-auto px-3 gap-1.5" : ""
        } ${className}`}
      >
        {icon}
        {showLabel && <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{label}</span>}
      </button>

      {/* Instant Floating Tooltip */}
      {!showLabel && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover/btn:flex group-focus-within/btn:flex flex-col items-center z-[60] animate-in fade-in-0 zoom-in-95 duration-100"
        >
          <div className="whitespace-nowrap rounded-none bg-[#1c1c1c] text-[#fbf5ea] border border-[#333333] px-2.5 py-1 text-xs font-medium shadow-2xl drop-shadow-md">
            {label}
          </div>
          <div className="w-2 h-2 -mt-1 rotate-45 bg-[#1c1c1c] border-r border-b border-[#333333]" />
        </div>
      )}
    </div>
  );

  if (resource && action) {
    return (
      <PermissionGuard resource={resource} action={action}>
        {button}
      </PermissionGuard>
    );
  }

  return button;
}

interface BulkActionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  children: React.ReactNode;
}

export function BulkActionToolbar({
  selectedCount,
  onClear,
  children,
}: BulkActionToolbarProps) {
  const t = useTranslations("Admin");

  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-admin-action text-admin-on-action rounded-none border border-admin-control-border shadow-2xl px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between sm:justify-center gap-2.5 sm:gap-4 max-w-[calc(100vw-24px)] animate-in fade-in-0 slide-in-from-bottom-4 duration-200 backdrop-blur-md"
    >
      {/* Selection Info */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-none bg-admin-on-action/20 text-admin-on-action text-xs font-mono font-bold">
          {selectedCount}
        </span>
        <span className="hidden sm:inline text-xs sm:text-sm font-medium tracking-tight whitespace-nowrap">
          {t("common.selectedItems", { count: selectedCount })}
        </span>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-admin-on-action/25 shrink-0" />

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {children}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-admin-on-action/25 shrink-0" />

      {/* Clear Button with Tooltip */}
      <div className="relative group/clear flex items-center justify-center">
        <button
          type="button"
          onClick={onClear}
          className="flex items-center justify-center w-8 h-8 min-w-8 min-h-8 rounded-none hover:bg-admin-on-action/15 transition-colors text-admin-on-action/80 hover:text-admin-on-action focus-visible:outline-2 focus-visible:outline-admin-focus active:scale-95 shrink-0"
          aria-label={t("common.clear")}
        >
          <X size={18} />
        </button>

        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full right-0 sm:left-1/2 sm:-translate-x-1/2 mb-2.5 hidden group-hover/clear:flex group-focus-within/clear:flex flex-col items-center z-[60] animate-in fade-in-0 zoom-in-95 duration-100"
        >
          <div className="whitespace-nowrap rounded-none bg-[#1c1c1c] text-[#fbf5ea] border border-[#333333] px-2.5 py-1 text-xs font-medium shadow-2xl drop-shadow-md">
            {t("common.clear")}
          </div>
          <div className="w-2 h-2 -mt-1 rotate-45 bg-[#1c1c1c] border-r border-b border-[#333333]" />
        </div>
      </div>
    </div>
  );
}
