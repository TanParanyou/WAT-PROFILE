import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useMockMediaStore } from "@/stores/mock-media-store";

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const mediaList = useMockMediaStore((s) => s.mediaList);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    const selected = mediaList.find((m) => m.id === selectedId);
    if (selected) {
      onSelect(selected.url);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Media">
      <div className="space-y-4 font-sans text-sm">
        <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto p-1">
          {mediaList.map((media) => (
            <button
              key={media.id}
              type="button"
              onClick={() => setSelectedId(media.id)}
              className={`relative aspect-video overflow-hidden border bg-zinc-50 ${
                selectedId === media.id ? "border-zinc-950 ring-1 ring-zinc-950" : "border-zinc-200"
              }`}
            >
              <img src={media.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-3">
          <button
            onClick={onClose}
            className="border border-zinc-200 bg-white px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="border border-zinc-950 bg-zinc-950 px-3 py-2 text-xs font-medium uppercase tracking-wider text-white disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}
