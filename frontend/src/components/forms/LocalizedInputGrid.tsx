"use client";

import { useLocale, useTranslations } from "next-intl";
import type { FieldErrors, FieldValues, Path, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { WEBSITE_CMS_LOCALES } from "@/utils/websiteCms";
import { useWebsiteCmsEditorStore } from "@/stores/website-cms-editor-store";

type Props<T extends FieldValues> = {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  setValue?: UseFormSetValue<T>;
  watch?: UseFormWatch<T>;
  errors?: FieldErrors<T>;
  disabled?: boolean;
  activeLocale?: "th" | "en" | "de";
  onActiveLocaleChange?: (locale: "th" | "en" | "de") => void;
};

export function LocalizedInputGrid<T extends FieldValues>({
  label,
  name,
  register,
  setValue,
  watch,
  errors,
  disabled,
  activeLocale: propActiveLocale,
  onActiveLocaleChange,
}: Props<T>) {
  const t = useTranslations("Admin.website");
  const store = useWebsiteCmsEditorStore();

  const active = propActiveLocale || store.activeLocale;
  const setActive = (locale: "th" | "en" | "de") => {
    if (onActiveLocaleChange) {
      onActiveLocaleChange(locale);
    } else {
      store.setActiveLocale(locale);
    }
  };

  const fieldErrors = readNestedErrors(errors, name);
  const groupErrorMessage = fieldErrors?.message;

  const hasError = (locale: string) => {
    return !!fieldErrors?.[locale]?.message;
  };

  const handleAutoTranslate = (targetLocale: "th" | "en" | "de") => {
    if (!setValue || !watch) return;
    const sourceLocale = (WEBSITE_CMS_LOCALES as readonly string[]).find(
      (loc) => loc !== targetLocale && String(watch(`${name}.${loc}` as Path<T>) || "").trim()
    );
    if (!sourceLocale) return;
    const sourceValue = String(watch(`${name}.${sourceLocale}` as Path<T>));
    
    let translatedText = sourceValue;
    if (sourceLocale === "th" && targetLocale === "en") {
      translatedText = `[EN] ${sourceValue}`;
    } else if (sourceLocale === "th" && targetLocale === "de") {
      translatedText = `[DE] ${sourceValue}`;
    } else {
      translatedText = `[Translated] ${sourceValue}`;
    }
    setValue(`${name}.${targetLocale}` as Path<T>, translatedText as any, { shouldDirty: true });
  };

  const handleCopyFrom = (targetLocale: "th" | "en" | "de") => {
    if (!setValue || !watch) return;
    const sourceLocale = (WEBSITE_CMS_LOCALES as readonly string[]).find(
      (loc) => loc !== targetLocale && String(watch(`${name}.${loc}` as Path<T>) || "").trim()
    );
    if (!sourceLocale) return;
    const sourceValue = String(watch(`${name}.${sourceLocale}` as Path<T>));
    setValue(`${name}.${targetLocale}` as Path<T>, sourceValue as any, { shouldDirty: true });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium text-zinc-950">{label}</div>
        <div className="inline-flex rounded-md border border-zinc-200 p-0.5 bg-zinc-50">
          {WEBSITE_CMS_LOCALES.map((locale) => {
            const isActive = active === locale;
            const hasErr = hasError(locale);
            return (
              <button
                key={locale}
                type="button"
                onClick={() => setActive(locale)}
                className={`relative px-2 py-0.5 text-xs font-medium rounded transition-all ${
                  isActive
                    ? "bg-white text-zinc-950 shadow-xs border border-zinc-200"
                    : "text-zinc-500 hover:text-zinc-950 border border-transparent"
                }`}
              >
                {locale.toUpperCase()}
                {hasErr && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5 rounded-full bg-red-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {WEBSITE_CMS_LOCALES.map((locale) => {
        if (active !== locale) return null;
        const fieldName = `${name}.${locale}` as Path<T>;
        const errorMsg = fieldErrors?.[locale]?.message;
        const hasSourceValue = watch
          ? (WEBSITE_CMS_LOCALES as readonly string[]).some(
              (loc) => loc !== locale && String(watch(`${name}.${loc}` as Path<T>) || "").trim()
            )
          : false;
        const currentValue = watch ? String(watch(fieldName) || "").trim() : "";

        return (
          <div key={locale} className="relative flex items-center">
            <Input
              disabled={disabled}
              error={errorMsg}
              {...register(fieldName)}
              className="pr-24"
            />
            
            {watch && setValue && !disabled && !currentValue && hasSourceValue && (
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCopyFrom(locale)}
                  className="text-[10px] text-zinc-500 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                  title="Copy from other language"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoTranslate(locale)}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                  title="Auto-translate"
                >
                  Translate
                </button>
              </div>
            )}
          </div>
        );
      })}

      {groupErrorMessage && (
        <p className="text-xs text-red-600">
          {groupErrorMessage === "At least one language is required"
            ? t("atLeastOneLanguageRequired")
            : groupErrorMessage}
        </p>
      )}
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
