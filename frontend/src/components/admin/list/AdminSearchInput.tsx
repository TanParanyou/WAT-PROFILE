"use client";

import React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export interface AdminSearchInputProps {
  label?: string;
  hideLabel?: boolean;
  value: string;
  isDebouncing: boolean;
  placeholder?: string;
  onChange(value: string): void;
  onSubmit(value: string): void;
  onClear(): void;
}

export function AdminSearchInput({
  label,
  hideLabel = false,
  value,
  isDebouncing,
  placeholder,
  onChange,
  onSubmit,
  onClear,
}: AdminSearchInputProps) {
  const t = useTranslations("admin.list");
  const displayLabel = hideLabel ? undefined : (label ?? t("search"));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit(value);
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full sm:w-60 md:w-64 lg:w-72 flex-shrink-0">
      {displayLabel && (
        <label className="text-xs font-medium text-admin-body h-5 min-h-[20px] flex items-center">
          {displayLabel}
        </label>
      )}
      <div className="relative flex items-center w-full">
        <div className="absolute left-3 flex items-center pointer-events-none text-admin-muted">
          {isDebouncing ? (
            <Loader2 className="h-4 w-4 animate-spin text-admin-action" />
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
          className="h-10 min-h-10 w-full pl-9 pr-9 text-xs sm:text-sm border border-admin-control-border rounded-none bg-admin-surface text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus transition-colors"
        />
        {value && (
          <div className="absolute right-1 flex items-center">
            <button
              type="button"
              onClick={onClear}
              aria-label={t("clearAll")}
              className="flex items-center justify-center w-8 h-8 rounded-none text-admin-muted hover:text-admin-foreground hover:bg-admin-surface-muted transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
