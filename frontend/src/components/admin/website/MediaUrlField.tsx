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
      <div className="border border-admin-border bg-admin-surface-muted p-3 rounded-lg">
        {isPreviewable ? (
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-20 shrink-0 place-items-center overflow-hidden border border-admin-border bg-admin-surface rounded-lg">
              <img src={value} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 text-sm text-admin-body">
              <div className="flex items-center gap-2 font-medium text-admin-foreground">
                <Image size={14} />
                Preview
              </div>
              <div className="truncate">{value}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-admin-muted">
            <LinkIcon size={14} />
            Add a URL to preview this media.
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          disabled={disabled}
          className="mt-3 border border-admin-control-border bg-admin-surface px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-admin-foreground hover:bg-admin-surface-muted disabled:opacity-50 rounded-lg"
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
