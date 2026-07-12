"use client";

import { useFormContext } from "react-hook-form";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";

interface AboutIntroTabProps {
  disabled?: boolean;
}

export function AboutIntroTab({ disabled = false }: AboutIntroTabProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext();

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
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />

        <LocalizedTextareaFields
          label="Hero Subtitle"
          name="content.hero_subtitle"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
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
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />

        <LocalizedTextareaFields
          label="Intro Description"
          name="content.intro_description"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
          rows={4}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <LocalizedTextFields
            label="Founded Info (e.g. Founded in 2026)"
            name="content.intro_founded"
            register={register as any}
            setValue={setValue as any}
            watch={watch as any}
            errors={errors as any}
            disabled={disabled}
          />
          <LocalizedTextFields
            label="Location Info (e.g. Germany)"
            name="content.intro_location"
            register={register as any}
            setValue={setValue as any}
            watch={watch as any}
            errors={errors as any}
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
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />

        <LocalizedTextFields
          label="Vision Subtitle"
          name="content.objective_subtitle"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />

        <LocalizedTextareaFields
          label="Quote / core statement"
          name="content.objective_content"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
          rows={3}
        />
      </div>
    </div>
  );
}
