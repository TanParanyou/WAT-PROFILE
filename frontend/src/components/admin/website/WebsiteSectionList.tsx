"use client";

import { Button } from "@/components/ui/Button";
import { getLocalizedCompleteness, getSectionHealth, sortContentSections } from "@/utils/websiteCms";
import type { ContentSection } from "@/types/website-cms";
import { cn } from "@/utils/cn";

export function WebsiteSectionList({
  sections,
  activeSectionId,
  onSelect,
}: {
  sections: ContentSection[];
  activeSectionId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {sortContentSections(sections).map((section) => {
        const health = getSectionHealth(section);
        const titleCount = getLocalizedCompleteness(section.title);

        return (
          <Button
            key={section.id}
            type="button"
            variant={activeSectionId === section.id ? "primary" : "outline"}
            className="h-auto w-full justify-between px-3 py-3"
            onClick={() => onSelect(section.id)}
          >
            <span className="min-w-0 text-left">
              <span className="block truncate text-sm font-medium">{section.section_key}</span>
              <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                {section.section_type} · {titleCount}/3 locales
              </span>
            </span>
            <span
              className={cn(
                "shrink-0 font-mono text-[11px] uppercase tracking-[0.18em]",
                health.tone === "ready" && "text-emerald-700",
                health.tone === "warn" && "text-amber-700",
                health.tone === "draft" && "text-zinc-700",
                health.tone === "muted" && "text-zinc-400",
              )}
            >
              {health.label}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
