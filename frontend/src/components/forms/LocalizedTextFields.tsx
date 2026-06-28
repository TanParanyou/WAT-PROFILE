"use client";

import type { FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { WEBSITE_CMS_LOCALES } from "@/utils/websiteCms";

type Props<T extends FieldValues> = {
  label: string;
  name: "title" | "description";
  register: UseFormRegister<T>;
  errors?: FieldErrors<T>;
  disabled?: boolean;
};

export function LocalizedTextFields<T extends FieldValues>({ label, name, register, errors, disabled }: Props<T>) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-zinc-950">{label}</div>
      <div className="grid gap-3 md:grid-cols-3">
        {WEBSITE_CMS_LOCALES.map((locale) => {
          const fieldName = `${name}.${locale}` as Path<T>;
          const fieldErrors = errors?.[name as keyof typeof errors] as Record<string, { message?: string }> | undefined;
          const error = fieldErrors?.[locale]?.message;
          return (
            <Input
              key={locale}
              label={locale.toUpperCase()}
              error={error}
              disabled={disabled}
              {...register(fieldName)}
            />
          );
        })}
      </div>
    </div>
  );
}
