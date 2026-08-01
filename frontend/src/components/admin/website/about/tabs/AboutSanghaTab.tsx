"use client";

import { useFormContext } from "react-hook-form";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";

interface AboutSanghaTabProps {
  disabled?: boolean;
}

export function AboutSanghaTab({ disabled = false }: AboutSanghaTabProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6">
      {/* Sangha Section */}
      <div className="space-y-4 bg-admin-surface border border-admin-border p-4 rounded-xl">
        <div>
          <h2 className="text-sm font-semibold text-admin-foreground">Sangha & Monks Introduction</h2>
          <p className="text-xs text-admin-muted">Mission and background of the monks.</p>
        </div>

        <LocalizedTextFields
          label="Sangha Section Title"
          name="content.sangha_title"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />

        <LocalizedTextareaFields
          label="Sangha Mission Statement"
          name="content.sangha_mission"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
          rows={3}
        />

        <LocalizedTextareaFields
          label="Current Work & Activities"
          name="content.sangha_current_work"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
          rows={4}
        />
      </div>
    </div>
  );
}
