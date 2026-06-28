"use client";

import { cn } from "@/utils/cn";
import type { ContentStatus } from "@/types/website-cms";

export function PageStatusPill({ status }: { status: ContentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.18em]",
        status === "published" && "border-emerald-300 bg-emerald-50 text-emerald-700",
        status === "draft" && "border-amber-300 bg-amber-50 text-amber-700",
        status === "archived" && "border-zinc-300 bg-zinc-100 text-zinc-600",
      )}
    >
      {status}
    </span>
  );
}
