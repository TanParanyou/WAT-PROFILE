import { useState, useEffect } from "react";
import { X, Loader2, Save } from "lucide-react";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MockMedia, useMockMediaStore } from "@/stores/mock-media-store";

export function MediaDetailsSidebar({
  media,
  onClose,
}: {
  media: MockMedia | null;
  onClose: () => void;
}) {
  const { updateMedia, deleteMedia, isSaving, isDeleting } = useMockMediaStore();
  
  const [formData, setFormData] = useState({
    alt: { th: "", en: "", de: "" },
    caption: "",
    credit: "",
  });

  useEffect(() => {
    if (media) {
      setFormData({
        alt: media.alt || { th: "", en: "", de: "" },
        caption: media.caption || "",
        credit: media.credit || "",
      });
    }
  }, [media]);

  if (!media) return null;

  const handleSave = async () => {
    await updateMedia(media.id, formData);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this media?")) {
      await deleteMedia(media.id);
      onClose();
    }
  };

  return (
    <div className="w-80 border-l border-zinc-200 bg-white p-4 h-full overflow-y-auto flex flex-col font-sans text-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-2 mb-4">
        <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">Details</span>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
          <X size={16} />
        </button>
      </div>
      
      <div className="space-y-4 flex-1">
        <div className="aspect-video w-full overflow-hidden border border-zinc-200 bg-zinc-50">
          <img src={media.url} alt="" className="h-full w-full object-contain" />
        </div>
        
        <div className="font-mono text-[11px] text-zinc-500 space-y-1">
          <div>Name: {media.filename}</div>
          <div>Size: {media.file_size}</div>
          <div>Dimensions: {media.dimensions}</div>
          <div>Uploaded: {media.created_at}</div>
        </div>
        
        <div className="space-y-3 pt-2">
          <MultiLangInput
            label="Alt Text"
            value={formData.alt}
            onChange={(val) => setFormData(prev => ({ ...prev, alt: val }))}
          />
          <Input
            label="Caption"
            value={formData.caption}
            onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
          />
          <Input
            label="Credit"
            value={formData.credit}
            onChange={(e) => setFormData(prev => ({ ...prev, credit: e.target.value }))}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-200 mt-4 space-y-2">
        <Button
          className="w-full text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
