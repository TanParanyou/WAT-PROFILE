"use client";

import { cn } from "@/utils/cn";
import type { ContentStatus } from "@/types/website-cms";

export function PageStatusPill({ status }: { status: ContentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.18em] rounded",
        status === "published" && "border-admin-success-border bg-admin-success-surface text-admin-success",
        status === "draft" && "border-admin-warning-border bg-admin-warning-surface text-admin-warning",
        status === "archived" && "border-admin-border bg-admin-surface-muted text-admin-muted",
      )}
    >
      {status}
    </span>
  );
}
