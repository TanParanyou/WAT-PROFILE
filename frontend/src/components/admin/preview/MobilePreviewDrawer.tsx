"use client";

import React, { useState } from "react";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MobilePreviewDrawerProps {
  title?: string;
  buttonLabel?: string;
  children: React.ReactNode;
}

export function MobilePreviewDrawer({
  title = "พรีวิวการแสดงผล (Mobile Preview)",
  buttonLabel = "ดูพรีวิวแบบเรียลไทม์",
  children,
}: MobilePreviewDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Preview Trigger Button */}
      <div className="lg:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          icon={<Eye size={16} />}
          className="w-full sm:w-auto text-admin-action border-admin-action hover:bg-admin-action-surface"
        >
          {buttonLabel}
        </Button>
      </div>

      {/* Mobile Preview Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-admin-surface p-4 lg:hidden overflow-y-auto space-y-4">
          <div className="flex items-center justify-between border-b border-admin-border pb-3 sticky top-0 bg-admin-surface z-10 py-1">
            <div className="flex items-center gap-2">
              <Eye size={18} className="text-admin-action" />
              <h3 className="text-base font-semibold text-admin-foreground">
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-admin-muted hover:text-admin-foreground rounded-none border border-admin-border bg-admin-surface-muted transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6 pt-2 pb-8">
            {children}
          </div>
        </div>
      )}
    </>
  );
}
