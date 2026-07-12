"use client";

import { useFormContext } from "react-hook-form";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";

interface AboutContentTabProps {
  disabled?: boolean;
}

export function AboutContentTab({ disabled = false }: AboutContentTabProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Hero Banner Section</h2>
          <p className="text-xs text-zinc-500">Header of the about page.</p>
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

      {/* History Section */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">History & Background</h2>
          <p className="text-xs text-zinc-500">Main descriptive history of the temple.</p>
        </div>

        <LocalizedTextFields
          label="History Section Title"
          name="content.history_title"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />

        <LocalizedTextareaFields
          label="History Description"
          name="content.history_description"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
          rows={6}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show_timeline"
            {...register("content.show_timeline")}
            disabled={disabled}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
          />
          <label htmlFor="show_timeline" className="text-sm font-medium text-zinc-700 select-none">
            Show History Timeline
          </label>
        </div>
      </div>
    </div>
  );
}
