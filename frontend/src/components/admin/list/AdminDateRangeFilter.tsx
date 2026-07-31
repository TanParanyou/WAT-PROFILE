"use client";

import React, { useId } from "react";

export interface AdminDateRangeFilterProps {
  id?: string;
  label: string;
  from?: string;
  to?: string;
  onChange(value: { from?: string; to?: string }): void;
}

export function AdminDateRangeFilter({
  id: customId,
  label,
  from = "",
  to = "",
  onChange,
}: AdminDateRangeFilterProps) {
  const generatedId = useId();
  const filterId = customId ?? generatedId;

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrom = e.target.value;
    if (newFrom && to && newFrom > to) {
      // Reject invalid range where from > to
      return;
    }
    onChange({ from: newFrom || undefined, to: to || undefined });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTo = e.target.value;
    if (from && newTo && from > newTo) {
      // Reject invalid range where from > to
      return;
    }
    onChange({ from: from || undefined, to: newTo || undefined });
  };

  return (
    <div className="flex flex-col gap-1.5 min-w-[220px]">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            id={`${filterId}-from`}
            type="date"
            value={from}
            onChange={handleFromChange}
            aria-label={`${label} เริ่มต้น`}
            className="w-full h-10 px-2 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <span className="text-xs text-gray-400">ถึง</span>
        <div className="flex-1">
          <input
            id={`${filterId}-to`}
            type="date"
            value={to}
            onChange={handleToChange}
            aria-label={`${label} สิ้นสุด`}
            className="w-full h-10 px-2 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
