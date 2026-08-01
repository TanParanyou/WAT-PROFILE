"use client";

import React from "react";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { parse, format } from "date-fns";

export interface AdminDateRangeFilterProps {
  id?: string;
  label: string;
  from?: string;
  to?: string;
  onChange(value: { from?: string; to?: string }): void;
}

export function AdminDateRangeFilter({
  label,
  from,
  to,
  onChange,
}: AdminDateRangeFilterProps) {
  const parseDate = (d?: string) => {
    if (!d) return undefined;
    const parsed = parse(d, "yyyy-MM-dd", new Date());
    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const formatDate = (d?: Date) => {
    if (!d) return undefined;
    return format(d, "yyyy-MM-dd");
  };

  return (
    <div className="min-w-[220px]">
      <DateRangePicker
        label={label}
        value={{ from: parseDate(from), to: parseDate(to) }}
        onChange={(range) =>
          onChange({
            from: formatDate(range.from),
            to: formatDate(range.to),
          })
        }
      />
    </div>
  );
}
