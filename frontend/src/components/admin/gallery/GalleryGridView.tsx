import React, { useState } from "react";
import { Maximize2, Edit3, Trash2, Copy, Check, Folder, Tag, GripVertical } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getLocalizedText } from "@/utils/localizedText";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Switch } from "@/components/ui/Switch";
import { Checkbox } from "@/components/ui/Checkbox";
import type { Gallery } from "@/types/entities";
import { cn } from "@/utils/cn";
import { useToast } from "@/hooks/useToast";

interface GalleryGridViewProps {
  items: Gallery[];
  isLoading?: boolean;
  selectedIds: Set<string | number>;
  onToggleSelect: (id: number) => void;
  onPreview: (index: number) => void;
  onEdit: (item: Gallery) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  isReordering?: boolean;
}

export function GalleryGridView({
  items,
  isLoading,
  selectedIds,
  onToggleSelect,
  onPreview,
  onEdit,
  onDelete,
  onToggleStatus,
  onReorder,
  isReordering,
}: GalleryGridViewProps) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleCopy = async (e: React.MouseEvent, item: Gallery) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.image_url);
      setCopiedId(item.id);
      toast.success(t("gallery.copied"));
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const dataIndexStr = e.dataTransfer.getData("text/plain");
    const sourceIndex = dataIndexStr !== "" ? parseInt(dataIndexStr, 10) : draggedIndex;
    if (sourceIndex !== null && !isNaN(sourceIndex) && sourceIndex !== targetIndex && onReorder) {
      onReorder(sourceIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-none border border-admin-border bg-admin-surface overflow-hidden"
          >
            <div className="aspect-[4/3] bg-admin-surface-muted" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-admin-surface-muted rounded-none w-3/4" />
              <div className="h-3 bg-admin-surface-muted rounded-none w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-admin-border rounded-none bg-admin-surface/50">
        <p className="text-admin-muted text-sm">{t("gallery.empty")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item, index) => {
        const isSelected = selectedIds.has(item.id);
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index && draggedIndex !== index;

        return (
          <div
            key={item.id}
            draggable={Boolean(onReorder)}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "group relative flex flex-col rounded-none border bg-admin-surface overflow-hidden transition-all duration-150",
              isDragging && "opacity-40 scale-95 border-dashed border-admin-focus",
              isDragOver && "ring-2 ring-admin-focus border-admin-focus scale-[1.02]",
              isSelected
                ? "border-admin-focus ring-1 ring-admin-focus"
                : !isDragging && !isDragOver && "border-admin-border hover:border-admin-control-border",
            )}
          >
            {/* Image Area */}
            <div
              className="relative aspect-[4/3] w-full bg-admin-surface-muted overflow-hidden cursor-pointer"
              onClick={() => onPreview(index)}
            >
              <img
                src={item.image_url}
                alt={getLocalizedText(item.caption, locale) || "Gallery image"}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105 select-none"
                loading="lazy"
                draggable={false}
              />

              {/* Top Bar Overlay: Checkbox & Display Order & Drag Handle */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                <div
                  className="bg-admin-surface/90 backdrop-blur-sm rounded-none p-1 border border-admin-border/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    id={`grid-select-${item.id}`}
                    checked={isSelected}
                    onChange={() => onToggleSelect(item.id)}
                  />
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {onReorder && (
                    <div
                      className="cursor-grab active:cursor-grabbing bg-black/70 hover:bg-black/90 text-white p-1 rounded-none border border-white/10 backdrop-blur-sm transition-colors"
                      title={t("gallery.dragToReorder")}
                    >
                      <GripVertical size={13} />
                    </div>
                  )}
                  <span className="bg-black/70 backdrop-blur-sm text-white text-[11px] font-mono px-2 py-0.5 rounded-none border border-white/10">
                    #{item.display_order}
                  </span>
                </div>
              </div>

              {/* Bottom Quick Action Overlay (Original UX, visible on hover / focus / mobile tap) */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 flex flex-wrap items-center justify-center content-center gap-2 p-3 backdrop-blur-[2px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(index);
                  }}
                  className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center bg-admin-surface text-admin-foreground rounded-none border border-admin-border hover:bg-admin-surface-muted transition-colors active:scale-95 shadow-sm"
                  title={t("gallery.viewFull")}
                >
                  <Maximize2 size={15} />
                </button>

                <PermissionGuard resource="gallery" action="update">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(item);
                    }}
                    className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center bg-admin-surface text-admin-foreground rounded-none border border-admin-border hover:bg-admin-surface-muted transition-colors active:scale-95 shadow-sm"
                    title={t("gallery.edit")}
                  >
                    <Edit3 size={15} />
                  </button>
                </PermissionGuard>

                <button
                  type="button"
                  onClick={(e) => handleCopy(e, item)}
                  className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center bg-admin-surface text-admin-foreground rounded-none border border-admin-border hover:bg-admin-surface-muted transition-colors active:scale-95 shadow-sm"
                  title={t("gallery.copyUrl")}
                >
                  {copiedId === item.id ? (
                    <Check size={15} className="text-admin-success" />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>

                <PermissionGuard resource="gallery" action="delete">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center bg-admin-danger text-admin-on-action rounded-none hover:brightness-90 transition-colors active:scale-95 shadow-sm"
                    title={t("gallery.delete")}
                  >
                    <Trash2 size={15} />
                  </button>
                </PermissionGuard>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
              {/* Caption */}
              <div>
                <p
                  className="text-sm font-medium text-admin-foreground line-clamp-1"
                  title={getLocalizedText(item.caption, locale)}
                >
                  {getLocalizedText(item.caption, locale) || (
                    <span className="text-admin-muted italic text-xs">
                      {t("gallery.noCaption")}
                    </span>
                  )}
                </p>
                {locale !== "en" && item.caption?.en && (
                  <p className="text-xs text-admin-muted line-clamp-1 mt-0.5">
                    {item.caption.en}
                  </p>
                )}
              </div>

              {/* Badges / Tags */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-admin-muted">
                {item.category && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-none bg-admin-surface-muted text-admin-foreground text-[11px] font-medium border border-admin-border">
                    <Folder size={11} className="shrink-0" />
                    <span className="truncate max-w-[100px]">
                      {getLocalizedText(item.category.name, locale) || item.category.slug}
                    </span>
                  </span>
                )}

                {item.event && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-none bg-admin-surface-muted text-admin-foreground text-[11px] font-medium border border-admin-border">
                    <Tag size={11} className="shrink-0" />
                    <span className="truncate max-w-[100px]">
                      {getLocalizedText(item.event.title, locale) || t("gallery.event")}
                    </span>
                  </span>
                )}
              </div>

              {/* Status Toggle Bar */}
              <div className="pt-2 border-t border-admin-border flex items-center justify-between">
                <StatusBadge label={item.is_active ? "Active" : "Inactive"} />

                <PermissionGuard resource="gallery" action="update">
                  <div
                    className="flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Switch
                      id={`grid-status-${item.id}`}
                      checked={item.is_active}
                      onChange={() => onToggleStatus(item.id, item.is_active)}
                    />
                  </div>
                </PermissionGuard>
              </div>
            </div>
          </div>
        );
      })}

      {/* Floating Subtle Saving Status Pill */}
      {isReordering && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-admin-surface/95 text-admin-foreground px-4 py-2.5 rounded-none border border-admin-border shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <div className="w-3.5 h-3.5 border-2 border-admin-focus border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="text-xs font-medium">{t("gallery.savingOrder")}</span>
        </div>
      )}
    </div>
  );
}
