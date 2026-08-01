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
  children: React.ReactNode;
  size?: DrawerSize;
  closeOnOverlayClick?: boolean;
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
  children,
  size = "md",
  closeOnOverlayClick = true,
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
        <div className="flex items-center justify-between border-b border-admin-border px-4 py-3 bg-admin-surface-muted">
          <h2 className="text-sm font-semibold text-admin-foreground">
            {title || ""}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-admin-muted hover:text-admin-foreground hover:bg-admin-border rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-hidden relative flex flex-col text-admin-body">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
