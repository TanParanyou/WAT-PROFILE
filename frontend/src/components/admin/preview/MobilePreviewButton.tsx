// file: MobilePreviewButton.tsx
"use client";

import React from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MobilePreviewButtonProps {
  /** Callback to open the drawer */
  onClick: () => void;
  /** Optional label, default Thai text */
  label?: string;
}

/**
 * Reusable button that triggers the mobile preview drawer.
 * Used across admin pages to keep UI consistent.
 */
export function MobilePreviewButton({
  onClick,
  label = "ดูพรีวิวแบบเรียลไทม์",
}: MobilePreviewButtonProps) {
  return (
    <div className="lg:hidden">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        icon={<Eye size={16} />}
        className="w-full sm:w-auto text-admin-action border-admin-action hover:bg-admin-action-surface"
      >
        {label}
      </Button>
    </div>
  );
}
