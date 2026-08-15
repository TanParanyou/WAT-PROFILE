"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { Upload, Loader2, Crop } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { mediaService } from "@/services/mediaService";
import type { Media } from "@/types/entities";
import { classifyMediaSource } from "@/lib/mediaOrigins";
import { useTranslations } from "next-intl";
import { ImageCropDialog } from "./ImageCropDialog";
import {
  AdminSearchInput,
  AdminActiveFilterChips,
  AdminListEmptyState,
  AdminListErrorState,
  AdminListToolbar,
} from "@/components/admin/list";

type MediaPickerDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
};

export function MediaPickerDialog({
  isOpen,
  onClose,
  onSelect,
}: MediaPickerDialogProps) {
  const t = useTranslations("Admin.mediaPicker");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Crop State
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState("image.jpg");
  const [isCropOpen, setIsCropOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      void fetchImages();
    }
  }, [isOpen]);

  const fetchImages = async () => {
    setIsLoading(true);
    setError("");
    try {
      const media = await mediaService.list();
      const uniqueMedia = Array.from(
        new Map(
          media
            .filter((item) => typeof item.url === "string" && item.url.trim() !== "")
            .map((item) => [item.url, item]),
        ).values(),
      );
      setMediaItems(uniqueMedia);
    } catch {
      setError(t("fetchError"));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return mediaItems;
    const q = searchQuery.toLowerCase();
    return mediaItems.filter((item) =>
      [item.original_filename, item.filename, item.url]
        .some((value) => value.toLowerCase().includes(q)),
    );
  }, [mediaItems, searchQuery]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("invalidType"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t("fileSizeExceeded"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCropSrc(reader.result);
        setCropFileName(file.name);
        setIsCropOpen(true);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenCropForGallery = (item: Media, e: React.MouseEvent) => {
    e.stopPropagation();
    if (classifyMediaSource(item.url) !== "managed") return;
    setCropSrc(item.url);
    setCropFileName("gallery-cropped.jpg");
    setIsCropOpen(true);
  };

  const handleCropComplete = async (croppedFile: File) => {
    setIsUploading(true);
    setError("");
    try {
      const uploaded = await mediaService.upload(croppedFile);
      setIsCropOpen(false);
      setCropSrc(null);
      onSelect(uploaded.url);
      onClose();
    } catch {
      setError(t("uploadError"));
    } finally {
      setIsUploading(false);
    }
  };

  const activeChips = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return [
      {
        key: "search",
        value: searchQuery,
        label: `${t("searchLabel")}: "${searchQuery}"`,
      },
    ];
  }, [searchQuery, t]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t("title")}
        size="lg"
      >
        <div className="space-y-4 font-sans text-sm">
          {/* Top Actions & Description */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-admin-border pb-3">
            <p className="text-xs text-admin-muted">
              {t("description")}
            </p>
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload size={14} />}
              className="shrink-0"
              disabled={isUploading}
            >
              {isUploading ? t("uploading") : t("uploadNew")}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <AdminListToolbar
            activeFilterCount={0}
            search={
              <AdminSearchInput
                value={searchQuery}
                isDebouncing={false}
                placeholder={t("searchPlaceholder")}
                onChange={(val) => setSearchQuery(val)}
                onSubmit={(val) => setSearchQuery(val)}
                onClear={() => setSearchQuery("")}
              />
            }
            activeFilters={
              activeChips.length > 0 ? (
                <AdminActiveFilterChips
                  filters={activeChips}
                  onRemove={() => setSearchQuery("")}
                  onClear={() => setSearchQuery("")}
                />
              ) : undefined
            }
          />

          {/* Main List Content */}
          {error ? (
            <AdminListErrorState
              message={error}
              onRetry={fetchImages}
            />
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-admin-action mb-2" size={32} />
              <span className="text-sm text-admin-muted">{t("loading")}</span>
            </div>
          ) : filteredImages.length === 0 ? (
            <AdminListEmptyState
              hasActiveQuery={Boolean(searchQuery.trim())}
              onClear={() => setSearchQuery("")}
              title={searchQuery.trim() ? t("searchNoResults") : t("empty")}
              description={
                searchQuery.trim()
                  ? t("searchNoResultsDescription", { query: searchQuery })
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[340px] overflow-y-auto pr-1">
              {filteredImages.map((item) => {
                const sourceKind = classifyMediaSource(item.url);
                const canCrop = sourceKind === "managed";

                return (
                <div
                  key={item.id || item.url}
                  className="group relative aspect-square overflow-hidden border border-admin-border rounded-none bg-admin-surface-muted transition-all hover:border-admin-focus"
                >
                  <img
                    src={item.url}
                    alt={item.alt_text || item.original_filename || t("selectImage")}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-admin-focus"
                    onClick={() => {
                      onSelect(item.url);
                      onClose();
                    }}
                    aria-label={`${t("selectImage")}: ${item.original_filename || item.url}`}
                  >
                    <span className="sr-only">{t("selectImage")}</span>
                  </button>
                  <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 flex gap-1 text-[10px] font-semibold uppercase tracking-wide">
                    <span className="bg-admin-surface/95 px-1.5 py-1 text-admin-foreground">
                      {sourceKind === "managed" ? t("managedBadge") : t("externalBadge")}
                    </span>
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center gap-1.5 bg-black/30 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    {canCrop ? (
                      <button
                        type="button"
                        onClick={(e) => handleOpenCropForGallery(item, e)}
                        className="pointer-events-auto inline-flex min-h-11 items-center gap-1 rounded-none bg-admin-surface/95 px-2.5 py-2 text-xs font-medium text-admin-foreground transition-colors hover:bg-admin-surface focus-visible:outline-2 focus-visible:outline-admin-focus"
                        title={t("cropTooltip")}
                      >
                        <Crop size={14} className="text-admin-action" aria-hidden="true" />
                        <span>{t("crop")}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="pointer-events-auto inline-flex min-h-11 items-center gap-1 rounded-none bg-admin-surface/95 px-2.5 py-2 text-xs font-medium text-admin-foreground transition-colors hover:bg-admin-surface focus-visible:outline-2 focus-visible:outline-admin-focus"
                        title={t("replaceExternal")}
                      >
                        <Upload size={14} aria-hidden="true" />
                        <span>{t("replaceExternal")}</span>
                      </button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Image Crop Dialog */}
      {cropSrc && (
        <ImageCropDialog
          isOpen={isCropOpen}
          imageSrc={cropSrc}
          fileName={cropFileName}
          onClose={() => {
            setIsCropOpen(false);
            setCropSrc(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
