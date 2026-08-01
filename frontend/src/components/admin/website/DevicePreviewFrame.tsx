"use client";

import { cn } from "@/utils/cn";
import type { WebsiteCmsPreviewDevice } from "@/stores/website-cms-editor-store";

export function DevicePreviewFrame({
  children,
  device = "desktop",
}: {
  children: React.ReactNode;
  device?: WebsiteCmsPreviewDevice;
}) {
  return (
    <div className="border border-admin-border bg-admin-surface-muted p-3">
      <div
        className={cn(
          "mx-auto max-h-[calc(100vh-220px)] min-h-[560px] overflow-auto border border-admin-control-border bg-admin-surface shadow-sm transition-[max-width]",
          device === "mobile" && "max-w-[390px]",
          device === "tablet" && "max-w-[760px]",
          device === "desktop" && "max-w-[1120px]",
        )}
      >
        <div className="public-theme min-h-full bg-site-canvas text-site-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
