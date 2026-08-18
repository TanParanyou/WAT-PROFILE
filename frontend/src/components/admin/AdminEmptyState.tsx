"use client";

import React from "react";
import { FolderOpen, Search, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface AdminEmptyStateProps {
  /** Icon type or custom React node */
  icon?: "empty" | "search" | "error" | React.ReactNode;
  /** Main title */
  title: string;
  /** Subtitle / descriptive message */
  description?: string;
  /** Action button label */
  actionLabel?: string;
  /** Action button click handler */
  onAction?: () => void;
  /** Secondary action button label */
  secondaryActionLabel?: string;
  /** Secondary action click handler */
  onSecondaryAction?: () => void;
  /** Custom extra content */
  children?: React.ReactNode;
  /** Class name for root container */
  className?: string;
}

export function AdminEmptyState({
  icon = "empty",
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  children,
  className = "",
}: AdminEmptyStateProps) {
  const renderIcon = () => {
    if (React.isValidElement(icon)) return icon;

    switch (icon) {
      case "search":
        return <Search size={28} className="text-admin-muted" />;
      case "error":
        return <AlertCircle size={28} className="text-admin-danger" />;
      case "empty":
      default:
        return <FolderOpen size={28} className="text-admin-muted" />;
    }
  };

  return (
    <div
      className={`p-10 text-center flex flex-col items-center justify-center border border-dashed border-admin-border bg-admin-surface/50 rounded-none ${className}`}
    >
      <div className="w-14 h-14 rounded-none border border-admin-border bg-admin-surface flex items-center justify-center mb-3">
        {renderIcon()}
      </div>

      <h3 className="text-sm font-bold text-admin-foreground mb-1">{title}</h3>

      {description && (
        <p className="text-xs text-admin-muted max-w-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}

      {children}

      {(onAction || onSecondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          {onAction && actionLabel && (
            <Button
              type="button"
              variant="primary"
              onClick={onAction}
              className="min-h-10 text-xs px-4"
            >
              {actionLabel}
            </Button>
          )}

          {onSecondaryAction && secondaryActionLabel && (
            <Button
              type="button"
              variant="outline"
              onClick={onSecondaryAction}
              className="min-h-10 text-xs px-3.5"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
