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
    <div className="relative flex flex-col gap-1 w-full sm:w-44 md:w-48 lg:w-52 flex-shrink-0" ref={containerRef}>
      <label htmlFor={filterId} className="text-xs font-medium text-admin-body h-5 min-h-[20px] flex items-center">
        {label}
      </label>
      <button
        id={filterId}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full h-10 min-h-10 rounded-none border border-admin-control-border bg-admin-surface px-3 py-1.5 text-xs sm:text-sm focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus",
          isOpen ? "border-admin-focus" : ""
        )}
      >
        <span className="truncate text-admin-foreground">
          {selectedCount === 0 ? "ทั้งหมด" : `เลือกแล้ว ${selectedCount} รายการ`}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-admin-muted transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 flex w-full min-w-[200px] max-w-[calc(100vw-2rem)] flex-col rounded-none border border-admin-border bg-admin-surface p-2 text-sm max-h-56 overflow-y-auto">
          {options.length > 10 && (
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-admin-muted" />
              <input
                type="text"
                value={optionSearch}
                onChange={(e) => setOptionSearch(e.target.value)}
                placeholder="ค้นหาตัวเลือก..."
                className="w-full rounded-none border border-admin-control-border bg-admin-surface py-1 pl-8 pr-2 text-xs text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-admin-focus"
              />
            </div>
          )}
          {filteredOptions.length === 0 ? (
            <span className="py-2 text-center text-xs text-admin-muted">
              ไม่พบตัวเลือก
            </span>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredOptions.map((opt) => {
                const isChecked = values.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="flex min-h-[32px] cursor-pointer items-center gap-2 rounded-none px-2 hover:bg-admin-surface-muted text-sm text-admin-body select-none"
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
