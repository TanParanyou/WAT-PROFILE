"use client";

import type { FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { WEBSITE_CMS_LOCALES } from "@/utils/websiteCms";

type Props<T extends FieldValues> = {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  errors?: FieldErrors<T>;
  disabled?: boolean;
};

export function LocalizedInputGrid<T extends FieldValues>({
  label,
  name,
  register,
  errors,
  disabled,
}: Props<T>) {
  const fieldErrors = readNestedErrors(errors, name);

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-zinc-950">{label}</div>
      <div className="grid gap-3 md:grid-cols-3">
        {WEBSITE_CMS_LOCALES.map((locale) => (
          <Input
            key={locale}
            label={locale.toUpperCase()}
            error={fieldErrors?.[locale]?.message}
            disabled={disabled}
            {...register(`${name}.${locale}` as Path<T>)}
          />
        ))}
      </div>
    </div>
  );
}

function readNestedErrors<T extends FieldValues>(errors: FieldErrors<T> | undefined, path: Path<T>) {
  if (!errors) return undefined;

  return String(path)
    .split(".")
    .reduce<Record<string, { message?: string }> | undefined>((current, key) => {
      if (!current || typeof current !== "object") return undefined;
      return current[key] as Record<string, { message?: string }> | undefined;
    }, errors as unknown as Record<string, { message?: string }>);
}
