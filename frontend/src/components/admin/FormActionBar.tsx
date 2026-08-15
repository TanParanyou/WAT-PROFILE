"use client";

import React from "react";
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/Button";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";

export interface FormActionBarProps {
  /** Indicates whether the form has unsaved changes */
  isDirty?: boolean;
  /** Text to show when form is dirty. Defaults to i18n "Admin.common.unsavedChanges" */
  unsavedText?: string;
  /** Custom status or informational content on the left (e.g., last saved timestamp) */
  statusContent?: React.ReactNode;

  /** Primary save button label. Defaults to "บันทึก" or "บันทึกการเปลี่ยนแปลง" based on isEditMode */
  saveText?: string;
  /** Icon for primary save button. Defaults to <Save size={16} /> */
  saveIcon?: React.ReactNode;
  /** Loading/submitting state for the save button */
  isLoading?: boolean;
  /** Whether the save button is disabled */
  isSaveDisabled?: boolean;
  /** Click handler for save button (when saveButtonType="button") */
  onSave?: () => void;
  /** Type of save button. Default: "submit" */
  saveButtonType?: "submit" | "button";
  /** Edit mode flag to automatically switch default save label */
  isEditMode?: boolean;

  /** Whether to show cancel button. Default: true if onCancel or cancelHref is provided */
  showCancel?: boolean;
  /** Cancel button label. Defaults to i18n "Admin.common.cancel" */
  cancelText?: string;
  /** Click handler for cancel button */
  onCancel?: () => void;
  /** Link URL for cancel button navigation */
  cancelHref?: string;
  /** Whether the cancel button is disabled */
  isCancelDisabled?: boolean;

  /** Additional action elements (e.g. Delete, Preview, Publish buttons) */
  extraActions?: React.ReactNode;
  /** Fully custom actions container overriding default Save/Cancel buttons */
  actions?: React.ReactNode;

  /** Additional className for outer container */
  className?: string;
  /** Additional className for buttons wrapper */
  actionsClassName?: string;
  /** Whether the bar should stick to the bottom of the viewport. Default: true */
  sticky?: boolean;
  /** Optional children rendered before actions */
  children?: React.ReactNode;
}

export function FormActionBar({
  isDirty,
  unsavedText,
  statusContent,
  saveText,
  saveIcon,
  isLoading = false,
  isSaveDisabled = false,
  onSave,
  saveButtonType = "submit",
  isEditMode = false,
  showCancel,
  cancelText,
  onCancel,
  cancelHref,
  isCancelDisabled = false,
  extraActions,
  actions,
  className,
  actionsClassName,
  sticky = true,
  children,
}: FormActionBarProps) {
  const t = useTranslations("Admin.common");
  const router = useRouter();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (cancelHref) {
      router.push(cancelHref);
    }
  };

  const shouldShowCancel = showCancel ?? (Boolean(onCancel) || Boolean(cancelHref));
  const resolvedSaveText = saveText || (isEditMode ? t("saveChanges") : t("save"));
  const hasStatus = Boolean(isDirty || statusContent);

  return (
    <div
      className={cn(
        // Sticky positioning
        sticky && "sticky bottom-0 z-40",
        // Negative margins to align flush with AdminLayout main container padding
        "-mx-4 -mb-4 mt-8 sm:-mx-6 sm:-mb-6",
        // Responsive padding with iOS Safe Area support
        "px-4 py-3 sm:px-6 sm:py-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-4",
        // Visual styling (backdrop blur, border, shadow)
        "border-t border-admin-border bg-admin-surface/90 backdrop-blur-md transition-all",
        "shadow-[0_-4px_16px_rgba(0,0,0,0.05)]",
        // Responsive layout (stack vertically on mobile if status present, row on desktop)
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        className
      )}
    >
      {/* Left Slot: Unsaved Indicator / Status Content */}
      <div
        className={cn(
          "flex items-center gap-3",
          !hasStatus && "hidden sm:flex"
        )}
      >
        {isDirty && (
          <span className="flex items-center gap-2 text-xs font-medium text-admin-warning">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-admin-warning opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-admin-warning" />
            </span>
            <span>{unsavedText || t("unsavedChanges")}</span>
          </span>
        )}
        {statusContent}
      </div>

      {/* Children slot (if any) */}
      {children}

      {/* Right Slot: Action Buttons */}
      {actions ? (
        <div className={cn("flex w-full items-center gap-2.5 sm:w-auto sm:gap-3 justify-end", actionsClassName)}>
          {actions}
        </div>
      ) : (
        <div className={cn("flex w-full items-center gap-2.5 sm:w-auto sm:gap-3 justify-end", actionsClassName)}>
          {extraActions}

          {shouldShowCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isCancelDisabled || isLoading}
              className="flex-1 sm:flex-none sm:w-auto"
            >
              {cancelText || t("cancel")}
            </Button>
          )}

          <Button
            type={saveButtonType}
            variant="primary"
            isLoading={isLoading}
            disabled={isSaveDisabled || isLoading}
            onClick={onSave}
            icon={saveIcon !== undefined ? saveIcon : <Save size={16} />}
            className="flex-1 sm:flex-none sm:w-auto"
          >
            {resolvedSaveText}
          </Button>
        </div>
      )}
    </div>
  );
}

export default FormActionBar;
