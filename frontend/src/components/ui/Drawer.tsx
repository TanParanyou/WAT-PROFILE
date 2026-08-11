"use client";

import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

export type DrawerSize = "sm" | "md" | "lg" | "xl" | "full";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: DrawerSize;
  closeOnOverlayClick?: boolean;
  closeLabel?: string;
}

const sizeClasses: Record<DrawerSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl",
  xl: "max-w-4xl",
  full: "max-w-full",
};

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnOverlayClick = true,
  closeLabel = "Close drawer",
}: DrawerProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="admin-theme">
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/45 transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      {/* Drawer Container */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full border-l border-admin-border bg-admin-surface text-admin-foreground shadow-2xl transition-transform duration-300 flex flex-col",
          sizeClasses[size],
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-admin-border bg-admin-surface-muted px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-admin-foreground">
              {title || ""}
            </h2>
            {description ? <p className="mt-1 break-words text-sm text-admin-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-admin-muted hover:text-admin-foreground hover:bg-admin-border rounded-none transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
            aria-label={closeLabel}
          >
            <X size={20} />
          </button>
        </div>
        {/* Content */}
        <div className="min-h-0 flex-1 overflow-auto text-admin-body">
          {children}
        </div>
        {footer ? <div className="shrink-0 border-t border-admin-border bg-admin-surface-muted px-4 py-3 sm:px-5">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
