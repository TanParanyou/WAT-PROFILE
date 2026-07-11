import { X } from "lucide-react";
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
  const updateMedia = useMockMediaStore((s) => s.updateMedia);
  const deleteMedia = useMockMediaStore((s) => s.deleteMedia);

  if (!media) return null;

  return (
    <div className="w-80 border-l border-zinc-200 bg-white p-4 h-full overflow-y-auto space-y-4 font-sans text-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
        <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">Details</span>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
          <X size={16} />
        </button>
      </div>
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
          value={media.alt}
          onChange={(val) => updateMedia(media.id, { alt: val })}
        />
        <Input
          label="Caption"
          value={media.caption}
          onChange={(e) => updateMedia(media.id, { caption: e.target.value })}
        />
        <Input
          label="Credit"
          value={media.credit}
          onChange={(e) => updateMedia(media.id, { credit: e.target.value })}
        />
      </div>
      <div className="pt-4 border-t border-zinc-200">
        <Button
          variant="danger"
          className="w-full text-xs uppercase tracking-wider"
          onClick={() => {
            deleteMedia(media.id);
            onClose();
          }}
        >
          Delete Media
        </Button>
      </div>
    </div>
  );
}
