"use client";

import { useState } from "react";
import { Image, Link as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { MediaPickerDialog } from "@/components/admin/media/MediaPickerDialog";

export function MediaUrlField({
  label,
  value,
  disabled,
  inputProps,
  onUrlChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  onUrlChange?: (url: string) => void;
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const isPreviewable = /^https?:\/\//.test(value) || value.startsWith("/");

  return (
    <div className="space-y-2">
      <Input label={label} disabled={disabled} {...inputProps} />
      <div className="border border-zinc-200 bg-zinc-50 p-3">
        {isPreviewable ? (
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-20 shrink-0 place-items-center overflow-hidden border border-zinc-200 bg-white">
              <img src={value} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 text-sm text-zinc-600">
              <div className="flex items-center gap-2 font-medium text-zinc-950">
                <Image size={14} />
                Preview
              </div>
              <div className="truncate">{value}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <LinkIcon size={14} />
            Add a URL to preview this media.
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          disabled={disabled}
          className="mt-3 border border-zinc-200 bg-white px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-zinc-800 hover:bg-zinc-100 disabled:opacity-50"
        >
          Choose media
        </button>
      </div>

      <MediaPickerDialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(url) => {
          if (onUrlChange) {
            onUrlChange(url);
          }
        }}
      />
    </div>
  );
}
