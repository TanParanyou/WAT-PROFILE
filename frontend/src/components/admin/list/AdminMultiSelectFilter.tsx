"use client";

import React, { useState, useId } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Search } from "lucide-react";
import type { AdminFilterOption } from "@/features/admin-list/types";

export interface AdminMultiSelectFilterProps {
  id?: string;
  label: string;
  options: AdminFilterOption[];
  values: string[];
  onChange(values: string[]): void;
}

export function AdminMultiSelectFilter({
  id: customId,
  label,
  options,
  values = [],
  onChange,
}: AdminMultiSelectFilterProps) {
  const generatedId = useId();
  const filterId = customId ?? generatedId;
  const [optionSearch, setOptionSearch] = useState("");

  const filteredOptions =
    options.length > 10 && optionSearch.trim() !== ""
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(optionSearch.toLowerCase()),
        )
      : options;

  const handleToggle = (optionValue: string) => {
    if (values.includes(optionValue)) {
      onChange(values.filter((v) => v !== optionValue));
    } else {
      onChange([...values, optionValue]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 min-w-[180px]">
      <label htmlFor={filterId} className="text-xs font-semibold text-gray-700">
        {label}
      </label>
      <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-2 text-sm shadow-sm max-h-56 overflow-y-auto">
        {options.length > 10 && (
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={optionSearch}
              onChange={(e) => setOptionSearch(e.target.value)}
              placeholder="ค้นหา ตัวเลือก..."
              className="w-full rounded border border-gray-200 py-1 pl-8 pr-2 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>
        )}
        {filteredOptions.length === 0 ? (
          <span className="py-2 text-center text-xs text-gray-400">
            ไม่พบตัวเลือก
          </span>
        ) : (
          filteredOptions.map((opt) => {
            const isChecked = values.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex min-h-[36px] cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-gray-50 text-xs text-gray-700 select-none"
              >
                <Checkbox
                  checked={isChecked}
                  onChange={() => handleToggle(opt.value)}
                />
                <span className="truncate">{opt.label}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
