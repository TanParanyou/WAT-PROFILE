"use client";

import { Controller, useFormContext } from "react-hook-form";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";
import { MultiLangRichText } from "@/components/admin/rich-text/MultiLangRichText";
import type { AboutPageMasterFormData } from "@/schemas/website-page.schema";
import { normalizeLocalizedRichText } from "@/lib/rich-text/document";

const richTextLocales = [
  { code: "th", label: "TH" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
] as const;

interface AboutIntroTabProps {
  disabled?: boolean;
}

export function AboutIntroTab({ disabled = false }: AboutIntroTabProps) {
  const { register, setValue, watch, control, formState: { errors } } = useFormContext<AboutPageMasterFormData>();

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Hero Section</h2>
          <p className="text-xs text-zinc-500">Header title and subtitle for the About page.</p>
        </div>

        <LocalizedTextFields
          label="Hero Title"
          name="content.hero_title"
          register={register}
          setValue={setValue}
          watch={watch}
          errors={errors}
          disabled={disabled}
        />

        <LocalizedTextareaFields
          label="Hero Subtitle"
          name="content.hero_subtitle"
          register={register}
          setValue={setValue}
          watch={watch}
          errors={errors}
          disabled={disabled}
          rows={2}
        />
      </div>

      {/* Intro Section */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Introduction</h2>
          <p className="text-xs text-zinc-500">Basic intro text and details.</p>
        </div>

        <LocalizedTextFields
          label="Intro Title"
          name="content.intro_title"
          register={register}
          setValue={setValue}
          watch={watch}
          errors={errors}
          disabled={disabled}
        />

        <LocalizedTextareaFields
          label="Intro Description"
          name="content.intro_description"
          register={register}
          setValue={setValue}
          watch={watch}
          errors={errors}
          disabled={disabled}
          rows={4}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <LocalizedTextFields
            label="Founded Info (e.g. Founded in 2026)"
            name="content.intro_founded"
            register={register}
            setValue={setValue}
            watch={watch}
            errors={errors}
            disabled={disabled}
          />
          <LocalizedTextFields
            label="Location Info (e.g. Germany)"
            name="content.intro_location"
            register={register}
            setValue={setValue}
            watch={watch}
            errors={errors}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Objectives Section */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Objectives / Vision</h2>
          <p className="text-xs text-zinc-500">Vision, mission quote, and core message.</p>
        </div>

        <LocalizedTextFields
          label="Vision Section Title"
          name="content.objective_title"
          register={register}
          setValue={setValue}
          watch={watch}
          errors={errors}
          disabled={disabled}
        />

        <LocalizedTextFields
          label="Vision Subtitle"
          name="content.objective_subtitle"
          register={register}
          setValue={setValue}
          watch={watch}
          errors={errors}
          disabled={disabled}
        />

        <Controller
          control={control}
          name="content.objective_content"
          render={({ field }) => (
            <MultiLangRichText
              label="Quote / core statement"
              locales={[...richTextLocales]}
              defaultLocale="th"
              value={normalizeLocalizedRichText(field.value, richTextLocales.map((locale) => locale.code), "th")}
              onChange={field.onChange}
              disabled={disabled}
            />
          )}
        />
      </div>
    </div>
  );
}
