# Localized Tabbed Input Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ปรับปรุงคอมโพเนนต์ Localized Input (Text & Textarea) ใน CMS ให้รองรับการทำงานแบบ Inline Tabs ประหยัดพื้นที่ ซิงค์ภาษาได้ตาม `useLocale` และ Zustand store, แสดงจุดแดงแจ้งเตือนเมื่อเกิด Error ในภาษาอื่น และมีปุ่มช่วยคัดลอกและแปลภาษาด่วน

**Architecture:** 
1. เพิ่มคีย์ข้อความแจ้งเตือนแปลภาษาในไฟล์ JSON ของ admin locale
2. ปรับปรุงคอมโพเนนต์ `LocalizedTextFields.tsx` และ `LocalizedTextareaFields.tsx` ให้ใช้ State สำหรับภาษาที่เลือก (Active Locale) และสลับหน้าจอการแสดงผลของ Input ของภาษานั้น ๆ โดยมี Fallback เป็น `useLocale()` ของ next-intl และซิงค์กับ Zustand store
3. ออกแบบแถบ UI ให้แสดงผลสวยงาม สไตล์แอดมิน WAT-PROFILE แสดง Error dots บนแท็บภาษาที่มี Validation Error และเพิ่มปุ่ม Quick Translate (Mocking Google Translate หรือ AI Translate บน Client-side) และปุ่ม Copy from Source

**Tech Stack:** React 19, Next.js 16, Zustand, React Hook Form, next-intl, Zod, Tailwind CSS v4

## Global Constraints
- ต้องคงรูปแบบโครงสร้าง typescript และไม่กระทบโครงสร้าง validation เดิม
- แสดงผลในธีมสว่าง/มืด (Zinc) ของระบบอย่างสวยงามและเป็นธรรมชาติ
- การตอบกลับของโค้ด/เอกสารควรเป็นระเบียบเรียบร้อย

---

### Task 1: Add translation error messages

**Files:**
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

- [ ] **Step 1: เพิ่มคีย์แปลภาษาใน `frontend/src/messages/admin/th.json`**
  เพิ่ม `"atLeastOneLanguageRequired": "กรุณากรอกข้อมูลอย่างน้อย 1 ภาษา"` ในออบเจกต์ `"website"`
- [ ] **Step 2: เพิ่มคีย์แปลภาษาใน `frontend/src/messages/admin/en.json`**
  เพิ่ม `"atLeastOneLanguageRequired": "At least one language is required"` ในออบเจกต์ `"website"`
- [ ] **Step 3: เพิ่มคีย์แปลภาษาใน `frontend/src/messages/admin/de.json`**
  เพิ่ม `"atLeastOneLanguageRequired": "Mindestens eine Sprache ist erforderlich"` ในออบเจกต์ `"website"`
- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/messages/admin/
  git commit -m "feat: add localized validation messages for multi-language inputs"
  ```

### Task 2: Implement LocalizedTextFields Component

**Files:**
- Modify: `frontend/src/components/forms/LocalizedTextFields.tsx`

**Interfaces:**
- Consumes: `useLocale` from `next-intl`, `WEBSITE_CMS_LOCALES` from `@/utils/websiteCms`
- Produces: `LocalizedTextFields` component supporting:
  - `activeLocale?: "th" | "en" | "de"`
  - `onActiveLocaleChange?: (locale: "th" | "en" | "de") => void`

- [ ] **Step 1: แก้ไขและติดตั้ง Code ใน `frontend/src/components/forms/LocalizedTextFields.tsx`**
  ปรับปรุงโค้ดให้แสดงแท็บภาษาในแนวเดียวกับ Label สวิตช์การแสดงฟิลด์ Input แสดงจุดสีแดงถ้าภาษาอื่นมี error และแสดงปุ่ม "Auto-Translate" & "Copy"
  
  ```tsx
  "use client";

  import { useState } from "react";
  import { useLocale, useTranslations } from "next-intl";
  import type { FieldErrors, FieldValues, Path, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
  import { Input } from "@/components/ui/Input";
  import { WEBSITE_CMS_LOCALES } from "@/utils/websiteCms";
  import { TranslateIcon } from "lucide-react"; // ใช้ไอคอนหรือปุ่มข้อความสไตล์สวยๆ

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
    const systemLocale = useLocale();

    // ค้นหาภาษาเริ่มต้นจาก system locale หรือเป็น 'th' หากไม่ตรง
    const systemCmsLocale = WEBSITE_CMS_LOCALES.includes(systemLocale as any)
      ? (systemLocale as "th" | "en" | "de")
      : "th";

    const [localActiveLocale, setLocalActiveLocale] = useState<"th" | "en" | "de">(systemCmsLocale);

    const active = propActiveLocale || localActiveLocale;
    const setActive = (locale: "th" | "en" | "de") => {
      if (onActiveLocaleChange) {
        onActiveLocaleChange(locale);
      } else {
        setLocalActiveLocale(locale);
      }
    };

    const fieldErrors = errors?.[name as keyof typeof errors] as any;
    const groupErrorMessage = fieldErrors?.message; // ข้อความแจ้งเตือนหลักระดับกลุ่มภาษา เช่น "At least one language is required"

    // คอยตรวจว่าแต่ละภาษามีข้อผิดพลาดหรือไม่
    const hasError = (locale: string) => {
      return !!fieldErrors?.[locale]?.message;
    };

    // ฟังก์ชันแปลข้อมูลจำลองแบบ Client-side
    const handleAutoTranslate = (targetLocale: "th" | "en" | "de") => {
      if (!setValue || !watch) return;
      
      // หาแหล่งข้อมูลที่มีข้อความกรอกอยู่
      const sourceLocale = (WEBSITE_CMS_LOCALES as readonly string[]).find(
        (loc) => loc !== targetLocale && String(watch(`${name}.${loc}` as Path<T>) || "").trim()
      );
      
      if (!sourceLocale) return;

      const sourceValue = String(watch(`${name}.${sourceLocale}` as Path<T>));
      if (!sourceValue) return;

      // Mock Translation Logic
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

    // ฟังก์ชันคัดลอกข้อมูลตรงๆ
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
                  className={`relative px-2 py-0.5 text-xs font-medium rounded ${
                    isActive
                      ? "bg-white text-zinc-950 shadow-sm border border-zinc-200"
                      : "text-zinc-500 hover:text-zinc-950"
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
              <div className="relative flex items-center">
                <Input
                  disabled={disabled}
                  error={errorMsg}
                  {...register(fieldName)}
                  className="pr-20" // เผื่อปุ่มด้านขวา
                />
                
                {/* เครื่องมือช่วยสะดวกรวดเร็ว */}
                {watch && setValue && !disabled && !currentValue && hasSourceValue && (
                  <div className="absolute right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyFrom(locale)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 px-1.5 py-0.5 rounded transition-colors"
                      title="Copy from other language"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoTranslate(locale)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded transition-colors"
                      title="Auto-translate"
                    >
                      Translate
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* แสดงผล Error หลักระดับกลุ่ม (เช่น ยังไม่ได้กรอกข้อมูลสักภาษา) */}
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
  ```

- [ ] **Step 2: รันคำสั่งคอมไพล์หรือตรวจสอบเบื้องต้น**
  ตรวจสอบว่า typescript คอมไพล์ได้ตามปกติ
- [ ] **Step 3: Commit**
  ```bash
  git add frontend/src/components/forms/LocalizedTextFields.tsx
  git commit -m "feat: implement inline tabbed LocalizedTextFields with error indicators and translator tools"
  ```

### Task 3: Implement LocalizedTextareaFields Component

**Files:**
- Modify: `frontend/src/components/forms/LocalizedTextareaFields.tsx`

**Interfaces:**
- Consumes: `useLocale` from `next-intl`, `WEBSITE_CMS_LOCALES` from `@/utils/websiteCms`
- Produces: `LocalizedTextareaFields` component similar to task 2.

- [ ] **Step 1: แก้ไขและติดตั้ง Code ใน `frontend/src/components/forms/LocalizedTextareaFields.tsx`**
  ปรับปรุงให้เป็นแบบ Tabbed เช่นกัน
  ```tsx
  "use client";

  import { useState } from "react";
  import { useLocale, useTranslations } from "next-intl";
  import type { FieldErrors, FieldValues, Path, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
  import { WEBSITE_CMS_LOCALES } from "@/utils/websiteCms";

  type Props<T extends FieldValues> = {
    label: string;
    name: Path<T>;
    register: UseFormRegister<T>;
    setValue?: UseFormSetValue<T>;
    watch?: UseFormWatch<T>;
    errors?: FieldErrors<T>;
    rows?: number;
    disabled?: boolean;
    activeLocale?: "th" | "en" | "de";
    onActiveLocaleChange?: (locale: "th" | "en" | "de") => void;
  };

  export function LocalizedTextareaFields<T extends FieldValues>({
    label,
    name,
    register,
    setValue,
    watch,
    errors,
    rows = 4,
    disabled,
    activeLocale: propActiveLocale,
    onActiveLocaleChange,
  }: Props<T>) {
    const t = useTranslations("Admin.website");
    const systemLocale = useLocale();
    const systemCmsLocale = WEBSITE_CMS_LOCALES.includes(systemLocale as any)
      ? (systemLocale as "th" | "en" | "de")
      : "th";

    const [localActiveLocale, setLocalActiveLocale] = useState<"th" | "en" | "de">(systemCmsLocale);

    const active = propActiveLocale || localActiveLocale;
    const setActive = (locale: "th" | "en" | "de") => {
      if (onActiveLocaleChange) {
        onActiveLocaleChange(locale);
      } else {
        setLocalActiveLocale(locale);
      }
    };

    const fieldErrors = errors?.[name as keyof typeof errors] as any;
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
                  className={`relative px-2 py-0.5 text-xs font-medium rounded ${
                    isActive
                      ? "bg-white text-zinc-950 shadow-sm border border-zinc-200"
                      : "text-zinc-500 hover:text-zinc-950"
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
            <div key={locale} className="relative space-y-1">
              <textarea
                rows={rows}
                disabled={disabled}
                className="min-h-[96px] w-full border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-950 disabled:bg-zinc-50"
                {...register(fieldName)}
              />
              
              {watch && setValue && !disabled && !currentValue && hasSourceValue && (
                <div className="absolute right-3 bottom-3 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={() => handleCopyFrom(locale)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 px-1.5 py-0.5 rounded transition-colors"
                    title="Copy from other language"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoTranslate(locale)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded transition-colors"
                    title="Auto-translate"
                  >
                    Translate
                  </button>
                </div>
              )}
              {errorMsg ? <p className="text-xs text-red-600">{errorMsg}</p> : null}
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
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add frontend/src/components/forms/LocalizedTextareaFields.tsx
  git commit -m "feat: implement inline tabbed LocalizedTextareaFields with error indicators and translator tools"
  ```

### Task 4: Implement LocalizedInputGrid Component

**Files:**
- Modify: `frontend/src/components/forms/LocalizedInputGrid.tsx`

- [ ] **Step 1: แก้ไขและติดตั้ง Code ใน `frontend/src/components/forms/LocalizedInputGrid.tsx`**
  ```tsx
  "use client";

  import { useState } from "react";
  import { useLocale, useTranslations } from "next-intl";
  import type { FieldErrors, FieldValues, Path, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
  import { Input } from "@/components/ui/Input";
  import { WEBSITE_CMS_LOCALES } from "@/utils/websiteCms";

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
    const systemLocale = useLocale();
    const systemCmsLocale = WEBSITE_CMS_LOCALES.includes(systemLocale as any)
      ? (systemLocale as "th" | "en" | "de")
      : "th";

    const [localActiveLocale, setLocalActiveLocale] = useState<"th" | "en" | "de">(systemCmsLocale);

    const active = propActiveLocale || localActiveLocale;
    const setActive = (locale: "th" | "en" | "de") => {
      if (onActiveLocaleChange) {
        onActiveLocaleChange(locale);
      } else {
        setLocalActiveLocale(locale);
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
                  className={`relative px-2 py-0.5 text-xs font-medium rounded ${
                    isActive
                      ? "bg-white text-zinc-950 shadow-sm border border-zinc-200"
                      : "text-zinc-500 hover:text-zinc-950"
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
                className="pr-20"
              />
              
              {watch && setValue && !disabled && !currentValue && hasSourceValue && (
                <div className="absolute right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyFrom(locale)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 px-1.5 py-0.5 rounded transition-colors"
                    title="Copy from other language"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoTranslate(locale)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded transition-colors"
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
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add frontend/src/components/forms/LocalizedInputGrid.tsx
  git commit -m "feat: implement inline tabbed LocalizedInputGrid with error indicators and translator tools"
  ```

### Task 5: Link sync states in page and section editors

**Files:**
- Modify: `frontend/src/components/admin/website/WebsitePageMetadataEditor.tsx:102-108`
- Modify: `frontend/src/components/admin/website/sections/SectionContentEditorBase.tsx:88-98`

- [ ] **Step 1: ปรับปรุง `WebsitePageMetadataEditor.tsx` เพื่อส่ง Props ปัจจุบันและตัวช่วยสำหรับ react-hook-form**
  ```tsx
  // ...
  // รับ props เพิ่มเติมในฟังก์ชันแก้ไข metadata ของหน้า หรือส่งต่อ activeLocale และ register helpers
  // ...
  ```
  เราจะส่ง `activeLocale`, `setValue`, และ `watch` ให้กับ `LocalizedTextFields` และ `LocalizedTextareaFields`
- [ ] **Step 2: ปรับปรุง `SectionContentEditorBase.tsx` เพื่อส่ง Props ปัจจุบันและตัวช่วยสำหรับ react-hook-form**
  เราจะส่ง `activeLocale`, `setValue`, และ `watch` ให้กับ `LocalizedTextFields` และ `LocalizedTextareaFields`
- [ ] **Step 3: Commit**
  ```bash
  git add frontend/src/components/admin/website/
  git commit -m "feat: sync active locale and pass hook-form helpers to localized fields"
  ```

---

## 5. Verification Plan

### Automated Check
- รัน lint และ build เพื่อยืนยันว่าไม่มีข้อผิดพลาดทาง TypeScript:
  `npm run lint` หรือ `npm run build` ในโฟลเดอร์ `frontend`

### Manual Verification
1. เปิดหน้าแก้ไข CMS ของหน้าโฮมเพจ สังเกตการแสดงผลเป็นแบบแท็บสวยงาม
2. เปลี่ยนภาษาในแท็บฟิลด์ Title แล้วดูว่าเนื้อหาเปลี่ยนตาม
3. เคลียร์ข้อมูลฟิลด์ภาษาทั้งหมด แล้วกด Save เพื่อดูข้อความสีแดงแจ้งเตือนหลายภาษาระดับฟิลด์ที่ได้รับการแปลตรงจุด
4. ลองกดปุ่ม Translate และ Copy เพื่อยืนยันระบบการคัดลอก/แปลเบื้องต้น
