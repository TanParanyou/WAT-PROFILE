"use client";

import React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export interface AdminSearchInputProps {
  label?: string;
  value: string;
  isDebouncing: boolean;
  placeholder?: string;
  onChange(value: string): void;
  onSubmit(value: string): void;
  onClear(): void;
}

export function AdminSearchInput({
  label,
  value,
  isDebouncing,
  placeholder,
  onChange,
  onSubmit,
  onClear,
}: AdminSearchInputProps) {
  const t = useTranslations("admin.list");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit(value);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-md">
      {label && (
        <label className="text-sm font-medium text-gray-700 min-h-[24px] flex items-center">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        <div className="absolute left-3 flex items-center pointer-events-none text-gray-400">
          {isDebouncing ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t("searchPlaceholder")}
          aria-label={t("search")}
          className="w-full h-10 pl-9 pr-16 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
        />
        <div className="absolute right-1 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={onClear}
              aria-label={t("clearAll")}
              className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onSubmit(value)}
            aria-label={t("search")}
            className="flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
