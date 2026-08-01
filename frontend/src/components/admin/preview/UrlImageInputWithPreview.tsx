"use client";

import React, { useState } from "react";
import { Eye, Image as ImageIcon, X, Upload } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { useTranslations } from "next-intl";
import { MediaPickerDialog } from "@/components/admin/media/MediaPickerDialog";

interface UrlImageInputWithPreviewProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  error?: string;
  description?: string;
}

export function UrlImageInputWithPreview({
  label,
  value = "",
  onChange,
  placeholder = "https://...",
  error,
  description,
}: UrlImageInputWithPreviewProps) {
  const t = useTranslations("Admin.previews");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const previewSrc = value && value.trim() ? value.trim() : "";

  return (
    <div className="space-y-3 font-sans border border-admin-border p-4 bg-admin-surface rounded-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-sm font-semibold text-admin-foreground flex items-center gap-2">
            <ImageIcon size={16} className="text-admin-muted" />
            {label}
          </label>
          {description && <p className="text-xs text-admin-muted mt-0.5">{description}</p>}
        </div>

        <button
          type="button"
          onClick={() => setIsMediaPickerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-admin-surface-muted text-admin-foreground border border-admin-control-border hover:bg-admin-border transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
        >
          <Upload size={14} />
          <span>{t("selectMedia")}</span>
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-11 flex-1 rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="h-11 px-3 bg-admin-surface-muted border border-admin-control-border text-admin-muted hover:text-admin-danger hover:border-admin-danger transition-colors flex items-center justify-center"
            title={t("clearUrl")}
          >
            <X size={16} />
          </button>
        )}
      </div>
      {error && <p className="text-sm text-admin-danger mt-1">{error}</p>}

      {/* Live Image Preview Card */}
      <div className="mt-3 pt-3 border-t border-admin-border">
        <span className="text-xs font-semibold text-admin-muted uppercase tracking-wider block mb-2">
          {t("imagePreview")}
        </span>
        {previewSrc ? (
          <div className="relative inline-block group/preview border border-admin-border bg-admin-surface-muted p-1">
            <img
              src={previewSrc}
              alt="Preview"
              className="h-32 max-w-full object-contain bg-admin-surface border border-admin-border"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://placehold.co/200x200?text=Invalid+Image+URL";
              }}
            />
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute inset-0 bg-admin-action/60 text-admin-on-action flex flex-col items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-admin-focus"
              title={t("expandImage")}
            >
              <Eye size={22} />
              <span className="text-xs font-medium mt-1">{t("expandImage")}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 text-xs text-admin-muted bg-admin-surface-muted border border-dashed border-admin-border">
            <ImageIcon size={18} className="text-admin-muted flex-shrink-0" />
            <span>{t("noImage")}</span>
          </div>
        )}
      </div>

      <MediaPickerDialog
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => {
          onChange(url);
          setIsMediaPickerOpen(false);
        }}
      />

      {previewSrc && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          slides={[{ src: previewSrc }]}
        />
      )}
    </div>
  );
}
