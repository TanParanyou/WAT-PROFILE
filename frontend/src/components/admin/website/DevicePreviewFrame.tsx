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
    <div className="border border-zinc-200 bg-zinc-200 p-3">
      <div
        className={cn(
          "mx-auto max-h-[calc(100vh-220px)] min-h-[560px] overflow-auto border border-zinc-300 bg-white shadow-sm transition-[max-width]",
          device === "mobile" && "max-w-[390px]",
          device === "tablet" && "max-w-[760px]",
          device === "desktop" && "max-w-[1120px]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
