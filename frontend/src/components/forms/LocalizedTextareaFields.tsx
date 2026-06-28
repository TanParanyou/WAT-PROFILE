"use client";

import type { FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";
import { WEBSITE_CMS_LOCALES } from "@/utils/websiteCms";

type Props<T extends FieldValues> = {
  label: string;
  name: "title" | "description";
  register: UseFormRegister<T>;
  errors?: FieldErrors<T>;
  rows?: number;
  disabled?: boolean;
};

export function LocalizedTextareaFields<T extends FieldValues>({
  label,
  name,
  register,
  errors,
  rows = 4,
  disabled,
}: Props<T>) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-zinc-950">{label}</div>
      <div className="grid gap-3 md:grid-cols-3">
        {WEBSITE_CMS_LOCALES.map((locale) => {
          const fieldName = `${name}.${locale}` as Path<T>;
          const fieldErrors = errors?.[name as keyof typeof errors] as Record<string, { message?: string }> | undefined;
          const error = fieldErrors?.[locale]?.message;
          return (
            <label key={locale} className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500">{locale}</div>
              <textarea
                rows={rows}
                disabled={disabled}
                className="min-h-[96px] w-full border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-950"
                {...register(fieldName)}
              />
              {error ? <p className="text-xs text-red-600">{error}</p> : null}
            </label>
          );
        })}
      </div>
    </div>
  );
}
