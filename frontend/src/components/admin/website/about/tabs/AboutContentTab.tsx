"use client";

import { useFormContext } from "react-hook-form";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";

import { Checkbox } from "@/components/ui/Checkbox";

interface AboutContentTabProps {
  disabled?: boolean;
}

export function AboutContentTab({ disabled = false }: AboutContentTabProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="space-y-4 bg-admin-surface border border-admin-border p-4 rounded-none">
        <div>
          <h2 className="text-sm font-semibold text-admin-foreground">Hero Banner Section</h2>
          <p className="text-xs text-admin-muted">Header of the about page.</p>
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
      <div className="space-y-4 bg-admin-surface border border-admin-border p-4 rounded-none">
        <div>
          <h2 className="text-sm font-semibold text-admin-foreground">History & Background</h2>
          <p className="text-xs text-admin-muted">Main descriptive history of the temple.</p>
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

        <Checkbox
          id="show_timeline"
          label="Show History Timeline"
          {...register("content.show_timeline")}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
