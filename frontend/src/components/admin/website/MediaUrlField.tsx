"use client";

import { useState } from "react";
import { Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { MediaPickerDialog } from "@/components/admin/media/MediaPickerDialog";
import { classifyMediaSource } from "@/lib/mediaOrigins";
import { useTranslations } from "next-intl";

export function MediaUrlField({
  label,
  value,
  disabled,
  inputProps,
  onUrlChange,
  buttonLabel,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  onUrlChange?: (url: string) => void;
  buttonLabel?: string;
}) {
  const t = useTranslations("Admin.mediaUrlField");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const sourceKind = classifyMediaSource(value);
  const isPreviewable = value.trim() !== "" && sourceKind !== "invalid";
  const resolvedButtonLabel = buttonLabel || t("chooseManaged");

  return (
    <div className="space-y-2 font-sans">
      <div className="border border-admin-border bg-admin-surface-muted p-3 rounded-none">
        {isPreviewable ? (
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-20 shrink-0 place-items-center overflow-hidden border border-admin-border bg-admin-surface rounded-none">
              <img src={value} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 text-sm text-admin-body">
              <div className="flex items-center gap-2 font-medium text-admin-foreground">
                <ImageIcon size={14} aria-hidden="true" />
                {sourceKind === "managed" ? t("managed") : t("external")}
              </div>
              <div className="truncate text-xs text-admin-muted mt-0.5">{value}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-admin-muted">
            <LinkIcon size={14} aria-hidden="true" />
            {t("empty")}
          </div>
        )}
        {sourceKind === "external" ? (
          <p className="mt-2 text-xs text-admin-warning" role="status">
            {t("externalWarning")}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          disabled={disabled}
          className="mt-3 min-h-11 border border-admin-control-border bg-admin-surface px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-admin-foreground hover:bg-admin-surface-muted disabled:opacity-50 rounded-none transition-colors"
        >
          {resolvedButtonLabel}
        </button>
      </div>

      <details className="border border-admin-border bg-admin-surface rounded-none">
        <summary className="cursor-pointer px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-admin-muted focus-visible:outline-2 focus-visible:outline-admin-focus">
          {t("advanced")}
        </summary>
        <div className="border-t border-admin-border p-3">
          <Input label={label} disabled={disabled} {...inputProps} />
        </div>
      </details>

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
