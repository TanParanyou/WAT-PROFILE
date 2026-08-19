import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import { useMediaStore } from "@/stores/media-store";
import { mediaService } from "@/services/mediaService";
import type { Media, MediaMetadata } from "@/types/entities";

const DEFAULT_ALT = { th: "", en: "", de: "" };

export function MediaDetailsSidebar({
  media,
  onUpdated,
  onDeleted,
  onClose,
}: {
  media: Media | null;
  onUpdated?: (media: Media) => void;
  onDeleted?: () => void;
  onClose: () => void;
}) {
  const tMedia = useTranslations("Admin.media.details");
  const tCommon = useTranslations("Admin.common");
  const { updateMedia, deleteMedia, isSaving, isDeleting } = useMediaStore();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const referencesQuery = useQuery({
    queryKey: ["admin", "media", media?.id, "references"],
    queryFn: () => mediaService.getReferences(media!.id),
    enabled: Boolean(media),
  });
  const [formData, setFormData] = useState<MediaMetadata>(() => ({
    alt: { ...DEFAULT_ALT, ...(media?.alt_texts || media?.metadata?.alt || {}) },
    caption: media?.metadata?.caption || "",
    credit: media?.metadata?.credit || "",
    category: media?.category || "",
  }));

  if (!media) return null;

  const handleSave = async () => {
    try {
      const updated = await updateMedia(media.id, formData);
      onUpdated?.(updated);
      toast.success(tMedia("saveSuccess"));
    } catch {
      toast.error(tMedia("saveFailed"));
    }
  };

  const handleDelete = async () => {
    const accepted = await confirm({
      title: tMedia("confirmDeleteTitle"),
      message: referencesQuery.data?.length
        ? tMedia("confirmDeleteWithRefs", { count: referencesQuery.data.length })
        : tMedia("confirmDeleteMsg"),
      confirmText: tCommon("delete"),
      cancelText: tCommon("cancel"),
      variant: "danger",
    });

    if (!accepted) {
      return;
    }

    try {
      await deleteMedia(media.id);
      onDeleted?.();
      onClose();
      toast.success(tMedia("deleteSuccess"));
    } catch {
      toast.error(tMedia("deleteFailed"));
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await mediaService.restore(media.id);
      onDeleted?.();
      onClose();
      toast.success(tMedia("restoreSuccess"));
    } catch {
      toast.error(tMedia("restoreFailed"));
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePurge = async () => {
    const accepted = await confirm({
      title: tMedia("confirmPurgeTitle"),
      message: referencesQuery.data?.length
        ? tMedia("confirmPurgeWithRefs", { count: referencesQuery.data.length })
        : tMedia("confirmPurgeMsg"),
      confirmText: tMedia("purge"),
      cancelText: tCommon("cancel"),
      variant: "danger",
    });
    if (!accepted) return;
    setIsPurging(true);
    try {
      await mediaService.purge(media.id);
      onDeleted?.();
      onClose();
      toast.success(tMedia("purgeSuccess"));
    } catch {
      toast.error(tMedia("purgeFailed"));
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="w-80 border-l border-admin-border bg-admin-surface p-4 h-full overflow-y-auto flex flex-col font-sans text-sm">
      <ConfirmDialog />

      <div className="flex items-center justify-between border-b border-admin-border pb-2 mb-4">
        <span className="font-mono text-xs uppercase tracking-wider text-admin-muted">Details</span>
        <button onClick={onClose} className="text-admin-muted hover:text-admin-foreground">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4 flex-1">
        <div className="aspect-video w-full overflow-hidden border border-admin-border bg-admin-surface-muted rounded-none">
          <img src={media.url} alt="" className="h-full w-full object-contain" />
        </div>

        <div className="font-mono text-[11px] text-admin-muted space-y-1">
          <div>Name: {media.original_filename || media.filename}</div>
          <div>Size: {(media.size / 1024 / 1024).toFixed(2)} MB</div>
          <div>Type: {media.mime_type}</div>
          <div>Uploaded: {new Date(media.created_at).toLocaleString()}</div>
        </div>

        <div className="border border-admin-border p-3 text-xs text-admin-muted">
          <div className="mb-2 font-semibold text-admin-foreground">{tMedia("usageTitle")}</div>
          {referencesQuery.isLoading ? tCommon("loading") : null}
          {!referencesQuery.isLoading && referencesQuery.data?.length === 0 ? tMedia("noUsageFound") : null}
          <ul className="space-y-1">
            {referencesQuery.data?.map((reference) => (
              <li key={`${reference.kind}:${reference.id}`}>
                {reference.label} ({reference.kind})
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 pt-2">
          <MultiLangInput
            label={tMedia("altText")}
            value={formData.alt || DEFAULT_ALT}
            onChange={(val) => setFormData((prev) => ({ ...prev, alt: val }))}
          />
          <Input
            label={tMedia("caption")}
            value={formData.caption || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, caption: e.target.value }))
            }
          />
          <Input
            label={tMedia("folderCategory")}
            placeholder="e.g. general, events, monks, gallery, banners"
            value={typeof formData.category === "string" ? formData.category : ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, category: e.target.value }))
            }
          />
          <Input
            label={tMedia("credit")}
            value={formData.credit || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, credit: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="pt-4 border-t border-admin-border mt-4 space-y-2">
        <Button
          className="w-full text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? tCommon("saving") : tCommon("save")}
        </Button>
        {media.deleted_at ? (
          <>
            <Button
              className="w-full text-xs uppercase tracking-wider"
              onClick={handleRestore}
              disabled={isRestoring}
            >
              {isRestoring ? tCommon("saving") : tMedia("restore")}
            </Button>
            <Button
              variant="danger"
              className="w-full text-xs uppercase tracking-wider"
              onClick={handlePurge}
              disabled={isPurging}
            >
              {isPurging ? tCommon("saving") : tMedia("purge")}
            </Button>
          </>
        ) : (
          <Button
            variant="danger"
            className="w-full text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isDeleting ? tCommon("saving") : tCommon("delete")}
          </Button>
        )}
      </div>
    </div>
  );
}
