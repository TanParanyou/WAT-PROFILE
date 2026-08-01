"use client";

import React, { useState, useId, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Search, ChevronDown } from "lucide-react";
import type { AdminFilterOption } from "@/features/admin-list/types";
import { cn } from "@/utils/cn";

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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const selectedCount = values.length;

  return (
    <div className="relative flex flex-col gap-1.5 min-w-[180px]" ref={containerRef}>
      <label htmlFor={filterId} className="text-sm font-medium text-gray-700 min-h-[24px] flex items-center">
        {label}
      </label>
      <button
        id={filterId}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50",
          isOpen ? "ring-2 ring-amber-500/50 border-amber-500" : ""
        )}
      >
        <span className="truncate text-gray-700">
          {selectedCount === 0 ? "ทั้งหมด" : `เลือกแล้ว ${selectedCount} รายการ`}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 flex w-full flex-col rounded-lg border border-gray-200 bg-white p-2 text-sm shadow-lg max-h-56 overflow-y-auto min-w-[200px]">
          {options.length > 10 && (
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={optionSearch}
                onChange={(e) => setOptionSearch(e.target.value)}
                placeholder="ค้นหาตัวเลือก..."
                className="w-full rounded border border-gray-200 py-1 pl-8 pr-2 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          )}
          {filteredOptions.length === 0 ? (
            <span className="py-2 text-center text-xs text-gray-400">
              ไม่พบตัวเลือก
            </span>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredOptions.map((opt) => {
                const isChecked = values.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="flex min-h-[32px] cursor-pointer items-center gap-2 rounded px-2 hover:bg-gray-50 text-sm text-gray-700 select-none"
                  >
                    <Checkbox
                      checked={isChecked}
                      onChange={() => handleToggle(opt.value)}
                    />
                    <span className="truncate">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
