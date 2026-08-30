"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FieldErrors, FieldValues, Path, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { WEBSITE_CMS_LOCALES } from "@/utils/websiteCms";
import { useWebsiteCmsEditorStore } from "@/stores/website-cms-editor-store";
import { useAiTranslate } from "@/hooks/useAiTranslate";

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

export function LocalizedTextFields<T extends FieldValues>({
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
  const { translateDraft, isTranslating } = useAiTranslate();
  const [translatingLocale, setTranslatingLocale] = useState<string | null>(null);

  const active = propActiveLocale || store.activeLocale;
  const setActive = (locale: "th" | "en" | "de") => {
    if (onActiveLocaleChange) {
      onActiveLocaleChange(locale);
    } else {
      store.setActiveLocale(locale);
    }
  };

  const fieldErrors = errors?.[name as keyof typeof errors] as Record<string, { message?: string }> | undefined;
  const groupErrorMessage = (fieldErrors as unknown as { message?: string })?.message;

  const hasError = (locale: string) => {
    return !!fieldErrors?.[locale]?.message;
  };

  const handleAutoTranslate = async (targetLocale: "th" | "en" | "de") => {
    if (!setValue || !watch || isTranslating) return;
    
    const sourceLocale = (WEBSITE_CMS_LOCALES as readonly string[]).find(
      (loc) => loc !== targetLocale && String(watch(`${name}.${loc}` as Path<T>) || "").trim()
    );
    
    if (!sourceLocale) return;

    const sourceValue = String(watch(`${name}.${sourceLocale}` as Path<T>)).trim();
    if (!sourceValue) return;

    setTranslatingLocale(targetLocale);
    try {
      const res = await translateDraft({
        text: sourceValue,
        source_lang: sourceLocale as "th" | "en" | "de",
        target_langs: [targetLocale],
      });

      const translatedText = res?.translations?.[targetLocale];
      if (translatedText) {
        setValue(`${name}.${targetLocale}` as Path<T>, translatedText as unknown as never, { shouldDirty: true });
      }
    } catch {
      // Error is handled via useAiTranslate toast notification
    } finally {
      setTranslatingLocale(null);
    }
  };

  const handleCopyFrom = (targetLocale: "th" | "en" | "de") => {
    if (!setValue || !watch) return;
    const sourceLocale = (WEBSITE_CMS_LOCALES as readonly string[]).find(
      (loc) => loc !== targetLocale && String(watch(`${name}.${loc}` as Path<T>) || "").trim()
    );
    if (!sourceLocale) return;
    const sourceValue = String(watch(`${name}.${sourceLocale}` as Path<T>));
    setValue(`${name}.${targetLocale}` as Path<T>, sourceValue as unknown as never, { shouldDirty: true });
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
          <div key={locale} className="space-y-1.5">
            <div className="relative">
              <Input
                disabled={disabled}
                error={errorMsg}
                {...register(fieldName)}
                className="pr-24"
              />
              
              {watch && setValue && !disabled && !currentValue && hasSourceValue && (
                <div className="absolute right-2 top-[9px] flex items-center gap-1 z-10">
                  <button
                    type="button"
                    onClick={() => handleCopyFrom(locale)}
                    className="text-[10px] text-admin-muted hover:text-admin-foreground bg-admin-surface-muted hover:bg-admin-surface border border-admin-border px-1.5 py-0.5 rounded-none transition-colors cursor-pointer"
                    title="Copy from other language"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    disabled={isTranslating}
                    onClick={() => handleAutoTranslate(locale)}
                    className="inline-flex items-center gap-1 text-[10px] text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                    title="Auto-translate via AI"
                  >
                    {translatingLocale === locale ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-2.5 h-2.5" />
                    )}
                    Translate
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {groupErrorMessage && (
        <p className="text-xs text-admin-danger">
          {groupErrorMessage === "At least one language is required"
            ? t("atLeastOneLanguageRequired")
            : groupErrorMessage}
        </p>
      )}
    </div>
  );
}
