"use client";

import React from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("admin.list");

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
    <div className="flex flex-col gap-1 w-full sm:w-56 md:w-60 flex-shrink-0">
      <DateRangePicker
        size="sm"
        label={label}
        placeholderText={t.has("selectDateRange") ? t("selectDateRange") : "เลือกช่วงเวลา"}
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
