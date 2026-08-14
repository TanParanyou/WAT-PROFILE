"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Copy, Check, ExternalLink, Edit3, Calendar, Folder, Tag } from "lucide-react";
import type { Gallery } from "@/types/entities";
import { useLocale, useTranslations } from "next-intl";
import { getLocalizedText } from "@/utils/localizedText";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useDateFormat } from "@/hooks/useDateFormat";

interface GalleryLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Gallery[];
  initialIndex: number;
  onEdit?: (item: Gallery) => void;
}

export function GalleryLightboxModal({
  isOpen,
  onClose,
  items,
  initialIndex,
  onEdit,
}: GalleryLightboxModalProps) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const { formatDate } = useDateFormat();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const currentItem = items[currentIndex];

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    },
    [isOpen, onClose, handlePrev, handleNext],
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  const handleCopyUrl = async () => {
    if (!currentItem?.image_url) return;
    try {
      await navigator.clipboard.writeText(currentItem.image_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!isOpen || !currentItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-6 select-none">
      {/* Top action bar */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {onEdit && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(currentItem);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-admin-surface/80 hover:bg-admin-surface text-admin-foreground text-sm font-medium transition-colors border border-admin-border backdrop-blur"
          >
            <Edit3 size={16} />
            <span>{t("common.edit")}</span>
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-none bg-admin-surface/80 hover:bg-admin-surface text-admin-foreground hover:text-admin-danger transition-colors border border-admin-border backdrop-blur"
          aria-label={t("common.close")}
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation - Prev */}
      {items.length > 1 && (
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-none bg-admin-surface/70 hover:bg-admin-surface text-admin-foreground border border-admin-border transition-colors backdrop-blur focus-visible:outline-2 focus-visible:outline-admin-focus"
          aria-label={t("common.previous")}
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Navigation - Next */}
      {items.length > 1 && (
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-none bg-admin-surface/70 hover:bg-admin-surface text-admin-foreground border border-admin-border transition-colors backdrop-blur focus-visible:outline-2 focus-visible:outline-admin-focus"
          aria-label={t("common.next")}
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Content wrapper */}
      <div
        className="relative flex flex-col lg:flex-row max-w-6xl w-full max-h-[90vh] bg-admin-surface rounded-none border border-admin-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main image viewer */}
        <div className="flex-1 min-h-[300px] lg:min-h-[500px] bg-black/95 flex items-center justify-center p-4 relative overflow-hidden">
          <img
            src={currentItem.image_url}
            alt={getLocalizedText(currentItem.caption, locale) || "Gallery Image"}
            className="max-h-[75vh] w-auto max-w-full object-contain"
          />
          {items.length > 1 && (
            <div className="absolute bottom-3 left-4 bg-black/70 text-white text-xs font-mono px-2.5 py-1 rounded-none border border-white/10 backdrop-blur">
              {currentIndex + 1} / {items.length}
            </div>
          )}
        </div>

        {/* Metadata sidebar */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-admin-border p-5 flex flex-col justify-between bg-admin-surface overflow-y-auto max-h-[35vh] lg:max-h-[75vh]">
          <div className="space-y-4">
            {/* Status & ID */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-admin-muted">ID: #{currentItem.id}</span>
              <StatusBadge label={currentItem.is_active ? "Active" : "Inactive"} />
            </div>

            {/* Captions */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-admin-muted">{t("gallery.captions")}</h3>
              <div className="space-y-1.5 text-sm">
                <div>
                  <span className="text-xs text-admin-muted font-medium mr-1.5">TH:</span>
                  <span className="text-admin-foreground">{currentItem.caption?.th || "-"}</span>
                </div>
                {currentItem.caption?.en && (
                  <div>
                    <span className="text-xs text-admin-muted font-medium mr-1.5">EN:</span>
                    <span className="text-admin-foreground">{currentItem.caption.en}</span>
                  </div>
                )}
                {currentItem.caption?.de && (
                  <div>
                    <span className="text-xs text-admin-muted font-medium mr-1.5">DE:</span>
                    <span className="text-admin-foreground">{currentItem.caption.de}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Tags */}
            <div className="space-y-2 pt-2 border-t border-admin-border text-sm">
              <div className="flex items-center gap-2 text-admin-muted">
                <Folder size={14} className="shrink-0" />
                <span className="text-xs">{t("gallery.category")}:</span>
                <span className="font-medium text-admin-foreground">
                  {getLocalizedText(currentItem.category?.name, locale) || currentItem.category?.slug || t("gallery.unspecified")}
                </span>
              </div>

              {currentItem.event && (
                <div className="flex items-center gap-2 text-admin-muted">
                  <Tag size={14} className="shrink-0" />
                  <span className="text-xs">{t("gallery.event")}:</span>
                  <span className="font-medium text-admin-foreground">
                    {getLocalizedText(currentItem.event.title, locale) || t("gallery.event")}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-admin-muted">
                <Calendar size={14} className="shrink-0" />
                <span className="text-xs">{t("gallery.uploadedAt")}:</span>
                <span className="font-medium text-admin-foreground">
                  {currentItem.created_at ? formatDate(currentItem.created_at) : "-"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-admin-muted">
                <span className="text-xs">{t("gallery.displayOrder")}:</span>
                <span className="font-mono text-admin-foreground font-semibold">
                  {currentItem.display_order}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="mt-5 pt-4 border-t border-admin-border space-y-2">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-none bg-admin-surface-muted hover:bg-admin-border text-admin-foreground text-sm font-medium transition-colors border border-admin-border focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-admin-success" />
                  <span className="text-admin-success">{t("gallery.copied")}</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>{t("gallery.copyUrl")}</span>
                </>
              )}
            </button>

            <a
              href={currentItem.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-none bg-transparent hover:bg-admin-surface-muted text-admin-muted hover:text-admin-foreground text-sm transition-colors"
            >
              <ExternalLink size={15} />
              <span>{t("gallery.viewFull")}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
