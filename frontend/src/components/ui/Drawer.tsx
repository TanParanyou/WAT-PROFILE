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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-zinc-950/45 transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      {/* Drawer Container */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-300 flex flex-col",
          sizeClasses[size],
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 bg-zinc-50">
          <h2 className="text-sm font-semibold text-zinc-950">
            {title || ""}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded transition-colors"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
