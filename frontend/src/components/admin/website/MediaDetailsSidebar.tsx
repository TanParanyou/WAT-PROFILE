import { useState } from "react";
import { X, Loader2, Save } from "lucide-react";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import { useMediaStore } from "@/stores/media-store";
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
  const { updateMedia, deleteMedia, isSaving, isDeleting } = useMediaStore();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [formData, setFormData] = useState<MediaMetadata>(() => ({
    alt: { ...DEFAULT_ALT, ...(media?.metadata?.alt || {}) },
    caption: media?.metadata?.caption || "",
    credit: media?.metadata?.credit || "",
  }));

  if (!media) return null;

  const handleSave = async () => {
    try {
      const updated = await updateMedia(media.id, formData);
      onUpdated?.(updated);
      toast.success("บันทึกข้อมูลสื่อเรียบร้อยแล้ว");
    } catch {
      toast.error("บันทึกข้อมูลสื่อไม่สำเร็จ");
    }
  };

  const handleDelete = async () => {
    const accepted = await confirm({
      title: "ยืนยันการลบสื่อ",
      message: "คุณต้องการลบสื่อนี้ออกจากฐานข้อมูลใช่หรือไม่",
      confirmText: "ลบ",
      cancelText: "ยกเลิก",
      variant: "danger",
    });

    if (!accepted) {
      return;
    }

    try {
      await deleteMedia(media.id);
      onDeleted?.();
      onClose();
      toast.success("ลบสื่อเรียบร้อยแล้ว");
    } catch {
      toast.error("ลบสื่อไม่สำเร็จ");
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
        <div className="aspect-video w-full overflow-hidden border border-admin-border bg-admin-surface-muted rounded-lg">
          <img src={media.url} alt="" className="h-full w-full object-contain" />
        </div>

        <div className="font-mono text-[11px] text-admin-muted space-y-1">
          <div>Name: {media.original_filename || media.filename}</div>
          <div>Size: {(media.size / 1024 / 1024).toFixed(2)} MB</div>
          <div>Type: {media.mime_type}</div>
          <div>Uploaded: {new Date(media.created_at).toLocaleString()}</div>
        </div>

        <div className="space-y-3 pt-2">
          <MultiLangInput
            label="Alt Text"
            value={formData.alt || DEFAULT_ALT}
            onChange={(val) => setFormData((prev) => ({ ...prev, alt: val }))}
          />
          <Input
            label="Caption"
            value={formData.caption || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, caption: e.target.value }))
            }
          />
          <Input
            label="Credit"
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
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          variant="danger"
          className="w-full text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isDeleting ? "Deleting..." : "Delete Media"}
        </Button>
      </div>
    </div>
  );
}
