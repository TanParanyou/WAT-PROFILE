"use client";

import type { CalendarResource } from "@/features/calendar/types";
import { Checkbox } from "@/components/ui/Checkbox";

interface CalendarResourceFilterProps {
  resources: readonly CalendarResource[];
  value: readonly string[];
  label: string;
  clearLabel: string;
  onChange: (resourceIds: readonly string[]) => void;
}

export function CalendarResourceFilter({ resources, value, label, clearLabel, onChange }: CalendarResourceFilterProps) {
  const selected = new Set(value);
  const toggle = (resourceId: string) => {
    const next = new Set(selected);
    if (next.has(resourceId)) next.delete(resourceId);
    else next.add(resourceId);
    onChange([...next].sort());
  };

  return (
    <fieldset className="space-y-2 border border-admin-border bg-admin-surface p-3">
      <legend className="px-1 text-sm font-semibold text-admin-foreground">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {resources.map((resource) => (
          <div key={resource.id} className="inline-flex min-h-11 items-center border border-admin-border px-3 text-sm text-admin-body hover:bg-admin-surface-muted">
            <Checkbox
              checked={selected.has(resource.id)}
              onChange={() => toggle(resource.id)}
              label={resource.title}
            />
          </div>
        ))}
        {selected.size > 0 ? (
          <button type="button" onClick={() => onChange([])} className="min-h-11 px-3 text-sm text-admin-action underline focus-visible:outline-[3px] focus-visible:outline-admin-focus">
            {clearLabel}
          </button>
        ) : null}
      </div>
    </fieldset>
  );
}
