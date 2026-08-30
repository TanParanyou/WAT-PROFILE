"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  PenLine,
  Bookmark,
  ShieldCheck,
  UserCheck,
  Trash2,
  Settings,
} from "lucide-react";
import type { SignatureManagerProps } from "@/types/signatures";
import { SignaturePad } from "@/app/[locale]/admin/donations/_components/SignaturePad";
import { ConfirmModal } from "@/components/ui/Modal";
import { cn } from "@/utils/cn";

export function SignatureManager({
  signatureMode,
  onModeChange,
  liveSignature,
  onLiveSignatureChange,
  savedSignatureUrl,
  defaultSignatoryName,
  selectedPresetId,
  onSelectPresetId,
  presets,
  onSaveToPresets,
  onDeletePreset,
  onSaveAsWatDefault,
  canSaveWatDefault = true,
  isSavingWatDefault = false,
  onOpenSettings,
}: SignatureManagerProps) {
  const t = useTranslations("Admin.signatures");
  const [isConfirmSaveDefaultOpen, setIsConfirmSaveDefaultOpen] = useState(false);
  const [pendingDataUrl, setPendingDataUrl] = useState<string | null>(null);

  const activeSignatureUrl =
    selectedPresetId === "default"
      ? savedSignatureUrl
      : presets.find((p) => p.id === selectedPresetId)?.url || savedSignatureUrl;

  const handleRequestSaveDefault = (dataUrl: string) => {
    setPendingDataUrl(dataUrl);
    setIsConfirmSaveDefaultOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingDataUrl || !onSaveAsWatDefault) return;
    await onSaveAsWatDefault(pendingDataUrl);
    setIsConfirmSaveDefaultOpen(false);
    setPendingDataUrl(null);
  };

  return (
    <div className="bg-admin-surface border border-admin-border p-4 space-y-3 rounded-none">
      <h3 className="text-xs font-bold uppercase tracking-wider text-admin-foreground border-b border-admin-border pb-2 flex items-center justify-between">
        <span>{t("title")}</span>
        <PenLine size={13} className="text-admin-muted" />
      </h3>

      {/* Mode Switcher */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { id: "saved", label: t("modeSaved") },
          { id: "pad", label: t("modePad") },
          { id: "none", label: t("modeNone") },
        ].map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onModeChange(s.id as "saved" | "pad" | "none")}
            className={cn(
              "py-1.5 px-2 text-xs font-medium border text-center transition-colors rounded-none",
              signatureMode === s.id
                ? "border-admin-focus bg-admin-focus/10 text-admin-focus font-bold"
                : "border-admin-control-border bg-admin-surface text-admin-foreground hover:bg-admin-surface-muted"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Mode 1: Saved Presets Library */}
      {signatureMode === "saved" && (
        <div className="p-3 bg-admin-surface-muted/50 border border-admin-border text-xs space-y-3 rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-admin-foreground font-semibold flex items-center gap-1.5">
              <Bookmark size={13} className="text-admin-muted" />
              <span>{t("presetLibrary")}</span>
            </span>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-admin-focus hover:underline text-[11px] font-medium inline-flex items-center gap-1"
              >
                <Settings size={11} />
                <span>{t("editInSettings")}</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {/* Default Temple Signature Item */}
            <div
              onClick={() => onSelectPresetId("default")}
              className={cn(
                "p-2 border cursor-pointer flex items-center justify-between transition-colors rounded-none",
                selectedPresetId === "default"
                  ? "border-admin-focus bg-admin-focus/10 text-admin-foreground font-semibold"
                  : "border-admin-control-border bg-admin-surface hover:bg-admin-surface-muted text-admin-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-admin-focus" />
                <div>
                  <p className="text-xs">{t("officialDefault")}</p>
                  <p className="text-[10px] text-admin-muted">
                    {defaultSignatoryName || t("abbotDefault")}
                  </p>
                </div>
              </div>
              {savedSignatureUrl ? (
                <span className="text-[10px] px-1.5 py-0.5 bg-admin-focus/10 text-admin-focus font-medium">
                  {t("readyToUse")}
                </span>
              ) : (
                <span className="text-[10px] text-admin-muted underline">
                  {t("noImageYet")}
                </span>
              )}
            </div>

            {/* Custom Saved Presets */}
            {presets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => onSelectPresetId(preset.id)}
                className={cn(
                  "p-2 border cursor-pointer flex items-center justify-between transition-colors rounded-none",
                  selectedPresetId === preset.id
                    ? "border-admin-focus bg-admin-focus/10 text-admin-foreground font-semibold"
                    : "border-admin-control-border bg-admin-surface hover:bg-admin-surface-muted text-admin-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <UserCheck size={14} className="text-admin-muted" />
                  <div>
                    <p className="text-xs">{preset.name}</p>
                    <p className="text-[10px] text-admin-muted font-mono">
                      {new Date(preset.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePreset(preset.id, preset.name);
                  }}
                  className="p-1 text-admin-muted hover:text-admin-danger transition-colors rounded-none"
                  title={t("deleteFromLibrary")}
                  aria-label={t("deleteFromLibrary")}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Active Preview Thumbnail */}
          {activeSignatureUrl && (
            <div className="mt-2 space-y-1">
              <span className="text-[10px] text-admin-muted block">
                {t("selectedPreview")}
              </span>
              <div className="h-14 bg-white border border-admin-control-border flex items-center justify-center p-1 rounded-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeSignatureUrl}
                  crossOrigin="anonymous"
                  alt="Active Signature Preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Live Signature Pad */}
      {signatureMode === "pad" && (
        <SignaturePad
          value={liveSignature}
          onChange={onLiveSignatureChange}
          onSaveAsDefault={onSaveAsWatDefault ? handleRequestSaveDefault : undefined}
          onSaveToPresets={onSaveToPresets}
          canSaveDefault={canSaveWatDefault}
          isSaving={isSavingWatDefault}
          label={t("livePadLabel")}
          clearButtonText={t("clearSignature")}
          helperText={t("padHelperText")}
        />
      )}

      {/* Mode 3: Blank For Manual Ink Signature */}
      {signatureMode === "none" && (
        <p className="text-[11px] text-admin-muted italic leading-relaxed">
          {t("blankModeNotice")}
        </p>
      )}

      {/* Safety Confirmation Dialog for Wat Default Update */}
      <ConfirmModal
        isOpen={isConfirmSaveDefaultOpen}
        onClose={() => {
          setIsConfirmSaveDefaultOpen(false);
          setPendingDataUrl(null);
        }}
        onConfirm={handleConfirmSave}
        title={t("confirmDefaultTitle")}
        message={t("confirmDefaultMessage")}
        confirmText={t("confirmButton")}
        cancelText={t("cancelButton")}
        variant="warning"
        isLoading={isSavingWatDefault}
      />
    </div>
  );
}
